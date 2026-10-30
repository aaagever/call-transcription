import { useEffect, useRef, useState } from "react";

const ACCEPTED_FORMATS = [
  ".mp3", ".mp4", ".m4a", ".wav", ".webm",
  ".flac", ".ogg", ".mpeg", ".mpga",
];

interface Props {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  currentFile: File | null;
  /** Length in seconds when currentFile was recorded in the app; null for uploads. */
  recordingSeconds: number | null;
}

// Plays the recording back so the user can check the microphone caught them
// before spending a transcription on it.
function usePlayback(file: File | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    audio.onplay = () => setPlaying(true);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  return { playing, toggle };
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatLength(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

// Reads the audio's length from its metadata, without decoding the file.
// Recordings from MediaRecorder often report no length; then nothing is shown.
function useAudioLength(file: File | null): number | null {
  const [length, setLength] = useState<{ file: File; seconds: number } | null>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration)) setLength({ file, seconds: audio.duration });
    };
    audio.src = url;
    return () => {
      audio.onloadedmetadata = null;
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);
  return length && length.file === file ? length.seconds : null;
}

export function FileUploader({ onFileSelect, onClear, currentFile, recordingSeconds }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const isRecording = recordingSeconds !== null;
  const metadataLength = useAudioLength(isRecording ? null : currentFile);
  const length = isRecording ? recordingSeconds : metadataLength;
  const playback = usePlayback(isRecording ? currentFile : null);

  function handleFile(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      alert(`Unsupported format. Accepted: ${ACCEPTED_FORMATS.join(", ")}`);
      return;
    }
    onFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function downloadFile(e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentFile) return;
    const url = URL.createObjectURL(currentFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      title={currentFile ? "Click or drop another file to replace it" : undefined}
      className={`border-2 rounded-lg cursor-pointer transition-colors ${
        dragOver
          ? "border-dashed border-blue-500 bg-blue-50"
          : currentFile
            ? "border-solid border-blue-200 bg-blue-50/40 hover:border-blue-300"
            : "border-dashed border-gray-300 hover:border-gray-400"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Let the same file be picked again after it was removed.
          e.target.value = "";
        }}
        className="hidden"
      />
      {currentFile ? (
        <div className="flex items-center gap-3 p-4 text-left">
          {isRecording ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playback.toggle();
              }}
              aria-label={playback.playing ? "Pause recording" : "Play recording"}
              title={playback.playing ? "Pause" : "Play it back"}
              className="w-10 h-10 rounded-lg bg-blue-600 text-white grid place-items-center shrink-0 hover:bg-blue-700"
            >
              {playback.playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                  <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
                </svg>
              )}
            </button>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white grid place-items-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {isRecording ? "Your recording" : currentFile.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatSize(currentFile.size)}
              {length !== null && ` · ${formatLength(length)}`}
              {isRecording && (
                <>
                  {" · "}
                  {/* A recording exists only in this browser until it is saved. */}
                  <button
                    type="button"
                    onClick={downloadFile}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Save recording
                  </button>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label="Remove file"
            title="Remove file"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-600 text-sm">
            Drop an audio file here or click to browse
          </p>
          <p className="text-gray-400 text-xs mt-1">
            MP3, MP4, M4A, WAV, WebM, FLAC, OGG
          </p>
        </div>
      )}
    </div>
  );
}
