export type TranscriptionProvider = "assemblyai" | "ivrit-ai";

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

export interface R2UploadResponse {
  url: string;
}
