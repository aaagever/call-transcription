import type { TranscriptResult, UploadResponse } from "./types";

const API_BASE = "/api";

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
  onStatusChange?.("Uploading audio...");
  const { upload_url } = await uploadAudio(file, apiKey);

  onStatusChange?.("Starting transcription...");
  const transcript = await startTranscription(upload_url, apiKey, languageCode);

  onStatusChange?.("Transcribing...");
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const result = await pollTranscript(transcript.id, apiKey);

        if (result.status === "completed") {
          resolve(result);
        } else if (result.status === "error") {
          reject(new Error(result.error || "Transcription failed"));
        } else {
          onStatusChange?.(
            `Transcribing... (${result.status})`
          );
          setTimeout(poll, 3000);
        }
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}
