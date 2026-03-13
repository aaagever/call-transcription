import { useState, useCallback } from "react";
import { ApiKeyInput } from "./components/ApiKeyInput";
import { LanguageSelector } from "./components/LanguageSelector";
import { FileUploader } from "./components/FileUploader";
import { AudioRecorder } from "./components/AudioRecorder";
import { TranscriptDisplay } from "./components/TranscriptDisplay";
import { ExportButtons } from "./components/ExportButtons";
import { transcribeAudio } from "./lib/api";
import type { TranscriptResult } from "./lib/types";

function App() {
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState("auto");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleKeyChange = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  async function handleTranscribe() {
    if (!apiKey) {
      setError("Please enter your AssemblyAI API key.");
      return;
    }
    if (!audioFile) {
      setError("Please upload or record an audio file.");
      return;
    }

    setError("");
    setTranscript(null);
    setIsTranscribing(true);

    try {
      const result = await transcribeAudio(
        audioFile,
        apiKey,
        language === "auto" ? undefined : language,
        setStatus
      );
      setTranscript(result);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
      setStatus("");
    } finally {
      setIsTranscribing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Call Transcription
        </h1>

        <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-6">
          <ApiKeyInput onKeyChange={handleKeyChange} />

          <div className="border-t border-gray-100 pt-4">
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <AudioRecorder onRecordingComplete={setAudioFile} />
              <span className="text-sm text-gray-400">or</span>
            </div>
            <FileUploader onFileSelect={setAudioFile} currentFile={audioFile} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={handleTranscribe}
              disabled={isTranscribing || !apiKey || !audioFile}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isTranscribing ? "Transcribing..." : "Transcribe"}
            </button>
          </div>

          {status && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {status}
            </div>
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
              <h2 className="text-lg font-semibold text-gray-900">
                Transcript
              </h2>
              <ExportButtons
                utterances={transcript.utterances}
                audioDuration={transcript.audio_duration}
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
