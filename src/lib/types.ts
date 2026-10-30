export type TranscriptionProvider = "assemblyai" | "soniox" | "ivrit-ai";

// AssemblyAI speech models.
export type AssemblyAIModel = "universal-3-5-pro" | "universal-2";

// The models the user can pick in the UI. The model decides the provider.
export type SpeechModel = AssemblyAIModel | "soniox-stt-async-v5";

export const MODEL_PROVIDER: Record<SpeechModel, TranscriptionProvider> = {
  "soniox-stt-async-v5": "soniox",
  "universal-3-5-pro": "assemblyai",
  "universal-2": "assemblyai",
};

export interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptResult {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text: string | null;
  utterances: Utterance[] | null;
  audio_duration: number | null;
  error: string | null;
}

export interface UploadResponse {
  upload_url: string;
}

export interface TranscribeRequest {
  audio_url: string;
  speaker_labels: boolean;
  language_code?: string;
  language_detection?: boolean;
}

export interface RunPodWord {
  word: string;
  start: number;
  end: number;
  probability?: number;
  speaker?: string;
}

export interface RunPodSegment {
  text: string;
  start: number;
  end: number;
  speakers: string[];
  words: RunPodWord[];
  extra_data?: Record<string, unknown>;
}

export interface RunPodJobResponse {
  id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMED_OUT";
  // Output structure varies: may be {result: [[segments]]}, {result: [segments]}, or [segments]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
  error?: string;
}

// Soniox async API (https://soniox.com/docs/stt/async/async-transcription).
export interface SonioxToken {
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  speaker?: string;
  language?: string;
  is_audio_event?: boolean;
}

export interface SonioxTranscription {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  error_message?: string | null;
  audio_duration_ms?: number | null;
}

export interface SonioxTranscript {
  id: string;
  text: string;
  tokens: SonioxToken[];
}

export interface R2UploadResponse {
  url: string;
  key: string;
}
