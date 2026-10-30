import { apiFetch, readJson } from "./api";
import type {
  SonioxToken,
  SonioxTranscript,
  SonioxTranscription,
  TranscriptResult,
  Utterance,
} from "./types";

// Soniox sends CORS headers (checked 2026-10-29), so unlike AssemblyAI the
// browser calls it directly: no Pages Function, no R2, and no 100MB
// Cloudflare request limit. Soniox caps a file at 300 minutes.
const SONIOX_BASE = "https://api.soniox.com/v1";
const SONIOX_MODEL = "stt-async-v5";
const PROVIDER = "Soniox";

function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}

async function uploadFile(file: File, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiFetch(
    `${SONIOX_BASE}/files`,
    { method: "POST", headers: authHeaders(apiKey), body: formData },
    "upload",
    PROVIDER
  );
  const { id } = await readJson<{ id: string }>(res, "upload");
  return id;
}

async function createTranscription(
  fileId: string,
  apiKey: string,
  languageCode?: string
): Promise<string> {
  const body: Record<string, unknown> = {
    model: SONIOX_MODEL,
    file_id: fileId,
    enable_speaker_diarization: true,
  };
  // Hints, not a hard setting. English is added because English terms come up
  // in most non-English work calls. Auto-detect sends no hints.
  if (languageCode) {
    body.language_hints = languageCode === "en" ? ["en"] : [languageCode, "en"];
  }

  const res = await apiFetch(
    `${SONIOX_BASE}/transcriptions`,
    {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "transcribe",
    PROVIDER
  );
  const { id } = await readJson<{ id: string }>(res, "transcribe");
  return id;
}

async function getTranscription(id: string, apiKey: string): Promise<SonioxTranscription> {
  const res = await apiFetch(
    `${SONIOX_BASE}/transcriptions/${id}`,
    { headers: authHeaders(apiKey) },
    "poll",
    PROVIDER
  );
  return readJson<SonioxTranscription>(res, "poll");
}

async function getTranscript(id: string, apiKey: string): Promise<SonioxTranscript> {
  const res = await apiFetch(
    `${SONIOX_BASE}/transcriptions/${id}/transcript`,
    { headers: authHeaders(apiKey) },
    "poll",
    PROVIDER
  );
  return readJson<SonioxTranscript>(res, "poll");
}

// Soniox keeps files and transcriptions for 30 days and counts them against
// the account's limits, so remove them once the result is in hand.
async function deleteResource(path: string, apiKey: string): Promise<void> {
  try {
    await fetch(`${SONIOX_BASE}/${path}`, { method: "DELETE", headers: authHeaders(apiKey) });
  } catch {
    // Best-effort cleanup -- don't fail the transcription
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Turns Soniox tokens into the app's utterances: a new utterance whenever the
// speaker changes. Soniox numbers speakers "1", "2", ...; they become A, B, ...
// in order of first appearance.
export function normalizeTokens(tokens: SonioxToken[]): {
  utterances: Utterance[];
  text: string;
  lastEndMs: number;
} {
  const letters = new Map<string, string>();
  const utterances: Utterance[] = [];
  const confidences: number[][] = [];
  let lastEndMs = 0;

  for (const token of tokens) {
    if (token.is_audio_event) continue;

    const id = token.speaker ?? "1";
    if (!letters.has(id)) letters.set(id, String.fromCharCode(65 + letters.size));
    const speaker = letters.get(id)!;

    const prev = utterances[utterances.length - 1];
    if (prev && prev.speaker === speaker) {
      prev.text += token.text;
      prev.end = token.end_ms;
      confidences[confidences.length - 1].push(token.confidence);
    } else {
      utterances.push({
        speaker,
        text: token.text,
        start: token.start_ms,
        end: token.end_ms,
        confidence: 0,
      });
      confidences.push([token.confidence]);
    }
    if (token.end_ms > lastEndMs) lastEndMs = token.end_ms;
  }

  utterances.forEach((u, i) => {
    u.text = u.text.trim();
    const c = confidences[i];
    u.confidence = c.reduce((sum, x) => sum + x, 0) / c.length;
  });

  const kept = utterances.filter((u) => u.text !== "");
  return { utterances: kept, text: kept.map((u) => u.text).join(" "), lastEndMs };
}

export async function transcribeWithSoniox(
  file: File,
  apiKey: string,
  languageCode?: string,
  onStatusChange?: (status: string) => void
): Promise<TranscriptResult> {
  onStatusChange?.("Uploading audio...");
  const fileId = await uploadFile(file, apiKey);
  let transcriptionId: string | null = null;

  try {
    onStatusChange?.("Starting transcription...");
    transcriptionId = await createTranscription(fileId, apiKey, languageCode);

    onStatusChange?.("Transcribing...");
    let job = await getTranscription(transcriptionId, apiKey);
    while (job.status !== "completed") {
      if (job.status === "error") {
        throw new Error(job.error_message || "Transcription failed");
      }
      onStatusChange?.(`Transcribing... (${job.status})`);
      await sleep(3000);
      job = await getTranscription(transcriptionId, apiKey);
    }

    const transcript = await getTranscript(transcriptionId, apiKey);
    const { utterances, text, lastEndMs } = normalizeTokens(transcript.tokens);

    return {
      id: transcriptionId,
      status: "completed",
      text,
      utterances,
      audio_duration: (job.audio_duration_ms ?? lastEndMs) / 1000,
      error: null,
    };
  } finally {
    if (transcriptionId) await deleteResource(`transcriptions/${transcriptionId}`, apiKey);
    await deleteResource(`files/${fileId}`, apiKey);
  }
}
