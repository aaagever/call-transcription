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
