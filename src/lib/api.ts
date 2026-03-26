import type { TranscriptResult, UploadResponse, R2UploadResponse } from "./types";

const API_BASE = "/api";

const R2_THRESHOLD = 90 * 1024 * 1024; // 90MB - under Cloudflare's 100MB limit
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk

export async function uploadAudio(
  file: File,
  apiKey: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Upload failed (${res.status})`);
  }

  return res.json();
}

async function uploadToR2(
  file: File,
  onProgress?: (fraction: number) => void
): Promise<R2UploadResponse> {
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
  languageCode?: string
): Promise<TranscriptResult> {
  const body: Record<string, unknown> = {
    audio_url: audioUrl,
    speaker_labels: true,
    speech_models: ["universal-3-pro", "universal-2"],
  };

  if (languageCode && languageCode !== "auto") {
    body.language_code = languageCode;
  } else {
    body.language_detection = true;
  }

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Transcription request failed (${res.status})`);
  }

  return res.json();
}

export async function pollTranscript(
  transcriptId: string,
  apiKey: string
): Promise<TranscriptResult> {
  const res = await fetch(`${API_BASE}/transcript/${transcriptId}`, {
    headers: { "X-Api-Key": apiKey },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Poll failed (${res.status})`);
  }

  return res.json();
}

export async function transcribeAudio(
  file: File,
  apiKey: string,
  languageCode?: string,
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
  const transcript = await startTranscription(audioUrl, apiKey, languageCode);

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
