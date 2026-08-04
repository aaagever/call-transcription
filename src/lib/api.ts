import type { TranscriptResult, UploadResponse, R2UploadResponse, SpeechModel } from "./types";

const API_BASE = "/api";

const R2_THRESHOLD = 90 * 1024 * 1024; // 90MB - under Cloudflare's 100MB limit
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk

// Maps the user-selected model to an AssemblyAI speech_models priority list.
// speech_models is a priority order with automatic fallback: AssemblyAI uses
// the first model that supports the audio's language, otherwise the next.
const SPEECH_MODEL_PRIORITY: Record<SpeechModel, string[]> = {
  // Newest flagship (best English + Hebrew); Universal-2 covers anything it doesn't.
  "universal-3-5-pro": ["universal-3-5-pro", "universal-2"],
  // Broadest language coverage, lower cost.
  "universal-2": ["universal-2"],
};

// ---- Error handling ----------------------------------------------------
// The browser's raw fetch error is just "Failed to fetch", which tells the
// user nothing. These helpers turn network-level failures and error
// responses into clear, actionable messages tagged with the step that failed.

type Step = "upload" | "create" | "part" | "complete" | "transcribe" | "poll";

// Human phrase for each step, used inside "...while {label}." sentences.
const STEP_LABEL: Record<Step, string> = {
  upload: "uploading your audio",
  create: "starting the upload",
  part: "uploading your audio",
  complete: "finalizing the upload",
  transcribe: "starting the transcription",
  poll: "checking the transcription status",
};

// Steps that send the audio file: their errors get the "extract to MP3" tip,
// since oversized uploads are the usual cause.
const UPLOAD_STEPS: ReadonlySet<Step> = new Set(["upload", "create", "part", "complete"]);
const MP3_TIP =
  " If this is a large recording, extract the audio to an MP3 (much smaller) and upload that instead.";

function httpMessage(step: Step, status: number, body: string): string {
  const label = STEP_LABEL[step];
  const tip = UPLOAD_STEPS.has(step) ? MP3_TIP : " Please try again in a moment.";

  if (status === 401 || status === 403) {
    return "Your AssemblyAI API key was rejected. Check the key and try again.";
  }
  if (status === 413) {
    return `The file is too large for the server to accept while ${label}.${MP3_TIP}`;
  }
  if (status === 429) {
    return "The transcription service is rate-limiting requests. Wait a moment and try again.";
  }
  if (status >= 500) {
    // Cloudflare worker exceptions surface as an "error code: 11xx" page.
    const workerCode = body.match(/error code: 1\d{3}/i)?.[0];
    const codePart = workerCode ? ` (${workerCode})` : ` (status ${status})`;
    return `The server hit an error while ${label}${codePart}.${tip}`;
  }
  // Other 4xx: surface the server's own short message if it looks useful.
  const detail = body && body.length > 0 && body.length < 200 ? ` ${body}` : "";
  return `Something went wrong while ${label} (status ${status}).${detail}`;
}

// fetch() that rejects only on network-level problems. Translates those, and
// any non-OK response, into a friendly Error instead of "Failed to fetch".
async function apiFetch(url: string, init: RequestInit, step: Step): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    // Reasons fetch() itself throws: offline, DNS failure, the connection
    // being reset mid-upload, CORS, or the page being opened from a file://
    // URL (where /api routes don't exist). Keep the raw error in the console
    // for debugging, show the user something they can act on.
    console.error(`[transcription] network error while ${STEP_LABEL[step]}:`, err);
    const tip = UPLOAD_STEPS.has(step) ? MP3_TIP : "";
    throw new Error(
      `Couldn't reach the server while ${STEP_LABEL[step]}. Try reloading the page, and check your connection.${tip}`
    );
  }

  if (!res.ok) {
    const body = (await res.text().catch(() => "")).trim();
    throw new Error(httpMessage(step, res.status, body));
  }

  return res;
}

// Parse a JSON response, with a clear message if the body isn't JSON
// (e.g. an HTML error page served by the SPA fallback when a route is missing).
async function readJson<T>(res: Response, step: Step): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    console.error(`[transcription] non-JSON response while ${STEP_LABEL[step]}:`, text.slice(0, 200));
    const tip = UPLOAD_STEPS.has(step) ? MP3_TIP : "";
    throw new Error(
      `The server returned an unexpected response while ${STEP_LABEL[step]}. ` +
        `Try reloading the page. The request may not have reached the right endpoint.${tip}`
    );
  }
}

export async function uploadAudio(
  file: File,
  apiKey: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch(
    `${API_BASE}/upload`,
    {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
    },
    "upload"
  );

  return readJson<UploadResponse>(res, "upload");
}

async function uploadToR2(
  file: File,
  onProgress?: (fraction: number) => void
): Promise<R2UploadResponse> {
  const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";

  // 1. Create multipart upload
  const createRes = await apiFetch(
    `${API_BASE}/r2-multipart/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ext }),
    },
    "create"
  );
  const { key, uploadId } = await readJson<{ key: string; uploadId: string }>(
    createRes,
    "create"
  );

  // 2. Upload chunks
  const parts: { partNumber: number; etag: string }[] = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append("chunk", chunk);
    formData.append("key", key);
    formData.append("uploadId", uploadId);
    formData.append("partNumber", String(i + 1));

    const partRes = await apiFetch(
      `${API_BASE}/r2-multipart/upload-part`,
      {
        method: "POST",
        body: formData,
      },
      "part"
    );

    const { etag } = await readJson<{ etag: string }>(partRes, "part");
    parts.push({ partNumber: i + 1, etag });
    onProgress?.((i + 1) / totalChunks);
  }

  // 3. Complete multipart upload
  const completeRes = await apiFetch(
    `${API_BASE}/r2-multipart/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId, parts }),
    },
    "complete"
  );

  return readJson<R2UploadResponse>(completeRes, "complete");
}

async function deleteFromR2(key: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/r2-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    // Best-effort cleanup
  }
}

export async function startTranscription(
  audioUrl: string,
  apiKey: string,
  languageCode?: string,
  model: SpeechModel = "universal-3-5-pro"
): Promise<TranscriptResult> {
  const body: Record<string, unknown> = {
    audio_url: audioUrl,
    speaker_labels: true,
    speech_models: SPEECH_MODEL_PRIORITY[model],
  };

  if (languageCode && languageCode !== "auto") {
    body.language_code = languageCode;
  } else {
    body.language_detection = true;
  }

  const res = await apiFetch(
    `${API_BASE}/transcribe`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    },
    "transcribe"
  );

  return readJson<TranscriptResult>(res, "transcribe");
}

export async function pollTranscript(
  transcriptId: string,
  apiKey: string
): Promise<TranscriptResult> {
  const res = await apiFetch(
    `${API_BASE}/transcript/${transcriptId}`,
    {
      headers: { "X-Api-Key": apiKey },
    },
    "poll"
  );

  return readJson<TranscriptResult>(res, "poll");
}

export async function transcribeAudio(
  file: File,
  apiKey: string,
  languageCode?: string,
  model: SpeechModel = "universal-3-5-pro",
  onStatusChange?: (status: string) => void
): Promise<TranscriptResult> {
  let audioUrl: string;
  let r2Key: string | null = null;

  if (file.size > R2_THRESHOLD) {
    // Large file: upload to R2 in chunks, pass presigned URL to AssemblyAI
    onStatusChange?.("Uploading audio to storage...");
    const r2Result = await uploadToR2(file, (fraction) => {
      const pct = Math.round(fraction * 100);
      onStatusChange?.(`Uploading audio to storage... ${pct}%`);
    });
    audioUrl = r2Result.url;
    r2Key = r2Result.key;
  } else {
    // Small file: upload directly through proxy
    onStatusChange?.("Uploading audio...");
    const { upload_url } = await uploadAudio(file, apiKey);
    audioUrl = upload_url;
  }

  onStatusChange?.("Starting transcription...");
  const transcript = await startTranscription(audioUrl, apiKey, languageCode, model);

  onStatusChange?.("Transcribing...");
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const result = await pollTranscript(transcript.id, apiKey);

        if (result.status === "completed") {
          if (r2Key) deleteFromR2(r2Key);
          resolve(result);
        } else if (result.status === "error") {
          if (r2Key) deleteFromR2(r2Key);
          reject(new Error(result.error || "Transcription failed"));
        } else {
          onStatusChange?.(
            `Transcribing... (${result.status})`
          );
          setTimeout(poll, 3000);
        }
      } catch (err) {
        if (r2Key) deleteFromR2(r2Key);
        reject(err);
      }
    };

    poll();
  });
}
