import type {
  TranscriptResult,
  R2UploadResponse,
  RunPodJobResponse,
  RunPodSegment,
  Utterance,
} from "./types";

const API_BASE = "/api";
const BLOB_SIZE_LIMIT = 7 * 1024 * 1024; // 7MB - safe limit for base64 within RunPod's 10MB payload cap

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const MULTIPART_THRESHOLD = 90 * 1024 * 1024; // 90MB - under Cloudflare's 100MB limit
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk

export async function uploadToR2(
  file: File,
  onProgress?: (fraction: number) => void
): Promise<R2UploadResponse> {
  if (file.size <= MULTIPART_THRESHOLD) {
    // Single upload for smaller files
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/r2-upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `R2 upload failed (${res.status})`);
    }

    onProgress?.(1);
    return res.json();
  }

  // Multipart upload for large files
  const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";

  // 1. Create multipart upload
  const createRes = await fetch(`${API_BASE}/r2-multipart/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ext }),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to initiate upload (${createRes.status})`);
  }
  const { key, uploadId } = await createRes.json();

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

    const partRes = await fetch(`${API_BASE}/r2-multipart/upload-part`, {
      method: "POST",
      body: formData,
    });

    if (!partRes.ok) {
      throw new Error(`Chunk upload failed (${partRes.status})`);
    }

    const { etag } = await partRes.json();
    parts.push({ partNumber: i + 1, etag });
    onProgress?.((i + 1) / totalChunks);
  }

  // 3. Complete multipart upload
  const completeRes = await fetch(`${API_BASE}/r2-multipart/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, uploadId, parts }),
  });

  if (!completeRes.ok) {
    throw new Error(`Failed to complete upload (${completeRes.status})`);
  }

  return completeRes.json();
}

export async function startIvritTranscription(
  file: File,
  audioUrl: string | null,
  apiKey: string,
  languageCode?: string,
  diarize: boolean = true
): Promise<{ id: string }> {
  const useBlob = file.size <= BLOB_SIZE_LIMIT;

  const transcribe_args: Record<string, unknown> = {
    language: languageCode || "he",
    diarize,
    output_options: {
      word_timestamps: true,
      extra_data: false,
    },
  };

  if (useBlob) {
    transcribe_args.blob = await fileToBase64(file);
  } else {
    transcribe_args.url = audioUrl;
  }

  const body = {
    input: {
      type: useBlob ? "blob" : "url",
      model: "ivrit-ai/whisper-large-v3-turbo-ct2",
      engine: "stable-whisper",
      transcribe_args,
    },
  };

  const res = await fetch(`${API_BASE}/runpod/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `RunPod job submission failed (${res.status})`);
  }

  return res.json();
}

export async function pollIvritTranscript(
  jobId: string,
  apiKey: string
): Promise<RunPodJobResponse> {
  const res = await fetch(`${API_BASE}/runpod/status/${jobId}`, {
    headers: { "X-Api-Key": apiKey },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `RunPod poll failed (${res.status})`);
  }

  return res.json();
}

function speakerLabel(id: string): string {
  const match = id.match(/(\d+)$/);
  if (!match) return id;
  const index = parseInt(match[1], 10);
  return String.fromCharCode(65 + index);
}

function normalizeSegments(segments: RunPodSegment[]): {
  utterances: Utterance[];
  text: string;
  duration: number;
} {
  const raw: Utterance[] = [];
  let maxEnd = 0;

  for (const seg of segments) {
    const text = (seg.text ?? "").trim();
    if (!text) continue;

    const speaker = seg.speakers?.length > 0
      ? speakerLabel(seg.speakers[0])
      : "A";

    raw.push({
      speaker,
      text,
      start: Math.round((seg.start ?? 0) * 1000),
      end: Math.round((seg.end ?? 0) * 1000),
      confidence: 1.0,
    });

    if ((seg.end ?? 0) > maxEnd) maxEnd = seg.end ?? 0;
  }

  // Merge consecutive segments from the same speaker
  const utterances: Utterance[] = [];
  for (const u of raw) {
    const prev = utterances[utterances.length - 1];
    if (prev && prev.speaker === u.speaker) {
      prev.text += ` ${u.text}`;
      prev.end = u.end;
    } else {
      utterances.push({ ...u });
    }
  }

  const text = utterances.map((u) => u.text).join(" ");
  return { utterances, text, duration: maxEnd };
}

async function deleteFromR2(key: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/r2-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    // Best-effort cleanup -- don't fail the transcription
  }
}

export async function transcribeWithIvrit(
  file: File,
  apiKey: string,
  languageCode?: string,
  onStatusChange?: (status: string) => void
): Promise<TranscriptResult> {
  let audioUrl: string | null = null;
  let r2Key: string | null = null;

  if (file.size <= BLOB_SIZE_LIMIT) {
    onStatusChange?.("Preparing audio...");
  } else {
    onStatusChange?.("Uploading audio to storage...");
    const r2Result = await uploadToR2(file, (fraction) => {
      const pct = Math.round(fraction * 100);
      onStatusChange?.(`Uploading audio to storage... ${pct}%`);
    });
    audioUrl = r2Result.url;
    r2Key = r2Result.key;
  }

  onStatusChange?.("Starting transcription...");
  const { id: jobId } = await startIvritTranscription(
    file,
    audioUrl,
    apiKey,
    languageCode
  );

  onStatusChange?.("Transcribing...");
  let currentJobId = jobId;
  let retriedWithoutDiarization = false;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const result = await pollIvritTranscript(currentJobId, apiKey);

        if (result.status === "COMPLETED") {
          let output = result.output;
          let segments: RunPodSegment[] | undefined;

          // Output may be wrapped in an array: [{ result: [[segments]] }]
          if (Array.isArray(output) && output.length > 0 && output[0]?.result) {
            output = output[0];
          }

          if (Array.isArray(output?.result?.[0])) {
            // Nested array: result is [[segment, segment, ...]]
            segments = output.result[0];
          } else if (Array.isArray(output?.result)) {
            // Flat array: result is [segment, segment, ...]
            segments = output.result as unknown as RunPodSegment[];
          } else if (Array.isArray(output)) {
            // Direct array output
            segments = output as unknown as RunPodSegment[];
          }

          if (!segments || segments.length === 0) {
            console.warn("ivrit-ai response structure:", JSON.stringify(output));
            if (r2Key) deleteFromR2(r2Key);
            reject(new Error("Transcription completed but returned no segments"));
            return;
          }

          const { utterances, text, duration } = normalizeSegments(segments);

          if (r2Key) deleteFromR2(r2Key);

          resolve({
            id: currentJobId,
            status: "completed",
            text,
            utterances,
            audio_duration: duration,
            error: null,
          });
        } else if (result.status === "FAILED" || result.status === "CANCELLED" || result.status === "TIMED_OUT") {
          const isDiarizationError =
            result.error &&
            (result.error.includes("Diarization failed") ||
              result.error.includes("minimum duration"));

          if (isDiarizationError && !retriedWithoutDiarization) {
            retriedWithoutDiarization = true;
            onStatusChange?.("Audio too short for speaker detection, retrying...");
            const retry = await startIvritTranscription(
              file,
              audioUrl,
              apiKey,
              languageCode,
              false
            );
            currentJobId = retry.id;
            onStatusChange?.("Transcribing...");
            setTimeout(poll, 3000);
          } else {
            if (r2Key) deleteFromR2(r2Key);
            reject(new Error(result.error || `Transcription ${result.status.toLowerCase()}`));
          }
        } else {
          onStatusChange?.(`Transcribing... (${result.status.toLowerCase().replace("_", " ")})`);
          setTimeout(poll, 3000);
        }
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}
