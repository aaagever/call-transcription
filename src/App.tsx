import { useState, useCallback } from "react";
import { ApiKeyInput } from "./components/ApiKeyInput";
import { LanguageSelector } from "./components/LanguageSelector";
import { ModelSelector } from "./components/ModelSelector";
import { FileUploader } from "./components/FileUploader";
import { AudioRecorder } from "./components/AudioRecorder";
import { RecordingDateInput } from "./components/RecordingDateInput";
import { TranscriptDisplay } from "./components/TranscriptDisplay";
import { ExportButtons } from "./components/ExportButtons";
import { TranscribeProgress } from "./components/TranscribeProgress";
import { formatElapsed } from "./lib/elapsed";
import { transcribeAudio } from "./lib/api";
import { transcribeWithIvrit } from "./lib/ivrit-api";
import { transcribeWithSoniox } from "./lib/soniox-api";
import { formatRecordingDate, toIsoDate } from "./lib/recording-date";
import { MODEL_PROVIDER } from "./lib/types";
import type { TranscriptResult, TranscriptionProvider, SpeechModel } from "./lib/types";

const PROVIDER_NAMES: Record<TranscriptionProvider, string> = {
  "assemblyai": "AssemblyAI",
  "soniox": "Soniox",
  "ivrit-ai": "RunPod",
};

// The model picked last is remembered in this browser; Soniox the first time.
const MODEL_STORAGE_KEY = "transcription-model";
const DEFAULT_MODEL: SpeechModel = "soniox-stt-async-v5";

function readStoredModel(): SpeechModel {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  return stored && stored in MODEL_PROVIDER ? (stored as SpeechModel) : DEFAULT_MODEL;
}

// The inputs that define a transcription request. Changing any of them is
// what re-enables the Transcribe button after a successful run.
interface TranscriptionInputs {
  file: File;
  apiKey: string;
  language: string;
  model: SpeechModel;
}

function playTone(type: "success" | "error") {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.3;

  if (type === "success") {
    osc.frequency.value = 523; // C5
    osc.start();
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15); // E5
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3); // G5
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.4);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.stop(ctx.currentTime + 0.6);
  } else {
    osc.frequency.value = 400;
    osc.start();
    osc.frequency.setValueAtTime(300, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
  }
}

function App() {
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState("auto");
  const [model, setModel] = useState<SpeechModel>(readStoredModel);
  // The model decides the provider, and with it which API key is in use.
  const provider = MODEL_PROVIDER[model];
  const [audioFile, setAudioFile] = useState<File | null>(null);
  // Length in seconds when audioFile was recorded here; null for uploaded files.
  const [recordingSeconds, setRecordingSeconds] = useState<number | null>(null);
  // Date of the meeting/recording itself (not of the transcription), as "YYYY-MM-DD".
  const [recordingDate, setRecordingDate] = useState("");
  // True while recordingDate is the prefilled file date and the user has not edited it.
  const [dateFromFile, setDateFromFile] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  // When the current run started, and how long the last successful one took.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);
  // Inputs of the last successful transcription. While the current inputs
  // still match them, the Transcribe button stays disabled so the same file
  // is not sent again by accident.
  const [lastRun, setLastRun] = useState<TranscriptionInputs | null>(null);

  const handleKeyChange = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  function handleModelChange(next: SpeechModel) {
    setModel(next);
    localStorage.setItem(MODEL_STORAGE_KEY, next);
  }

  // Prefill the recording date from the file's modified time. For a meeting
  // recording that is usually the meeting day; the user can correct it.
  const handleFileSelect = useCallback((file: File) => {
    setAudioFile(file);
    setRecordingSeconds(null);
    setRecordingDate(toIsoDate(file.lastModified));
    setDateFromFile(true);
  }, []);

  // A recording made in the app exists only in this browser, so the file card
  // offers to save it and to play it back. Its length comes from the recorder:
  // MediaRecorder's webm files usually report no length of their own.
  const handleRecordingComplete = useCallback((file: File, seconds: number) => {
    setAudioFile(file);
    setRecordingSeconds(seconds);
    setRecordingDate(toIsoDate(file.lastModified));
    setDateFromFile(true);
  }, []);

  // Removing the file also drops the date it prefilled; a date typed by hand stays.
  function handleFileClear() {
    setAudioFile(null);
    setRecordingSeconds(null);
    if (dateFromFile) {
      setRecordingDate("");
      setDateFromFile(false);
    }
  }

  function handleDateChange(isoDate: string) {
    setRecordingDate(isoDate);
    setDateFromFile(false);
  }

  async function handleTranscribe() {
    if (!apiKey) {
      setError(`Please enter your ${PROVIDER_NAMES[provider]} API key.`);
      return;
    }
    if (!audioFile) {
      setError("Please upload or record an audio file.");
      return;
    }

    setError("");
    setTranscript(null);
    setIsTranscribing(true);
    const t0 = Date.now();
    setStartedAt(t0);

    try {
      const langCode = language === "auto" ? undefined : language;
      let result: TranscriptResult;

      if (model === "soniox-stt-async-v5") {
        result = await transcribeWithSoniox(
          audioFile,
          apiKey,
          langCode,
          setStatus
        );
      } else if (provider === "ivrit-ai") {
        result = await transcribeWithIvrit(
          audioFile,
          apiKey,
          langCode,
          setStatus
        );
      } else {
        result = await transcribeAudio(
          audioFile,
          apiKey,
          langCode,
          model,
          setStatus
        );
      }

      setTranscript(result);
      setLastRun({ file: audioFile, apiKey, language, model });
      setLastRunMs(Date.now() - t0);
      setStatus("");
      playTone("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
      setStatus("");
      playTone("error");
    } finally {
      setIsTranscribing(false);
      setStartedAt(null);
    }
  }

  const alreadyTranscribed =
    lastRun !== null &&
    lastRun.file === audioFile &&
    lastRun.apiKey === apiKey &&
    lastRun.language === language &&
    lastRun.model === model;

  // Why Transcribe can't run right now, shown under the button rather than
  // only in a hover tooltip. Null while it can run, or while it is running.
  const disabledReason = isTranscribing
    ? null
    : !apiKey
      ? `Add your ${PROVIDER_NAMES[provider]} API key above to start.`
      : alreadyTranscribed
          ? `${lastRunMs !== null ? `Transcribed in ${formatElapsed(lastRunMs)}. ` : ""}Change the file, language or model to run it again.`
          : null;

  const recordingDateLabel = formatRecordingDate(recordingDate);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Call Transcription
        </h1>

        <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
          {/* The model decides the provider, so its key field sits right under it. */}
          <div className="space-y-3">
            <ModelSelector value={model} onChange={handleModelChange} />
            <ApiKeyInput key={provider} provider={provider} onKeyChange={handleKeyChange} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
              <span className="text-sm text-gray-400">or</span>
            </div>
            <FileUploader
              onFileSelect={handleFileSelect}
              onClear={handleFileClear}
              currentFile={audioFile}
              recordingSeconds={recordingSeconds}
            />
            <div className="mt-3">
              <RecordingDateInput
                value={recordingDate}
                fromFile={dateFromFile}
                onChange={handleDateChange}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={handleTranscribe}
              disabled={isTranscribing || !audioFile || disabledReason !== null}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isTranscribing
                ? "Transcribing..."
                : alreadyTranscribed
                  ? "Transcribed"
                  : "Transcribe"}
            </button>
            {disabledReason && (
              <p className="mt-2 text-xs text-gray-500 text-center">{disabledReason}</p>
            )}
          </div>

          {isTranscribing && startedAt !== null && (
            <TranscribeProgress status={status} startedAt={startedAt} />
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {transcript?.utterances && transcript.utterances.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Transcript
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {recordingDateLabel
                    ? `Recording date: ${recordingDateLabel}`
                    : "No recording date set. Set it above to include it in the downloads."}
                </p>
              </div>
              <ExportButtons
                utterances={transcript.utterances}
                audioDuration={transcript.audio_duration}
                recordingDate={recordingDate}
                sourceFileName={lastRun?.file.name ?? ""}
              />
            </div>
            <TranscriptDisplay utterances={transcript.utterances} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
