import { useEffect, useMemo, useRef, useState } from "react";
import { FileAudio, Pause, Play, Upload, X } from "lucide-react";

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
  /** The Record button, shown inside the empty drop area. */
  recorder?: React.ReactNode;
}

// Decorative waveform bars, shaped from the file name so each file looks a
// little different. Not the real audio: decoding a long file just for this
// would cost seconds and memory.
function waveBars(seed: string, count = 56): number[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin(i * 0.55 + h) * Math.cos(i * 0.21 + h / 7));
    return 6 + Math.round(22 * v);
  });
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

export function FileUploader({ onFileSelect, onClear, currentFile, recordingSeconds, recorder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const isRecording = recordingSeconds !== null;
  const metadataLength = useAudioLength(isRecording ? null : currentFile);
  const length = isRecording ? recordingSeconds : metadataLength;
  const playback = usePlayback(isRecording ? currentFile : null);
  const bars = useMemo(() => waveBars(currentFile?.name ?? ""), [currentFile]);

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
      className={`group rounded-2xl border-[1.5px] cursor-pointer transition-colors ${
        dragOver
          ? "border-dashed border-accent bg-[color-mix(in_srgb,var(--accent)_8%,var(--field))]"
          : currentFile
            ? "border-solid border-line bg-field hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]"
            : "border-dashed border-line bg-[color-mix(in_srgb,var(--field)_60%,transparent)] hover:border-accent hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--field))]"
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
        <div className="flex items-center gap-3.5 p-4 text-left">
          {isRecording ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playback.toggle();
              }}
              aria-label={playback.playing ? "Pause recording" : "Play recording"}
              title={playback.playing ? "Pause" : "Play it back"}
              className="w-11 h-11 rounded-xl accent-gradient text-white grid place-items-center shrink-0 hover:brightness-110"
            >
              {playback.playing ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              )}
            </button>
          ) : (
            <div className="w-11 h-11 rounded-xl accent-gradient text-white grid place-items-center shrink-0">
              <FileAudio className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink truncate">
              {isRecording ? "Your recording" : currentFile.name}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {formatSize(currentFile.size)}
              {length !== null && ` · ${formatLength(length)}`}
              {isRecording && (
                <>
                  {" · "}
                  {/* A recording exists only in this browser until it is saved. */}
                  <button
                    type="button"
                    onClick={downloadFile}
                    className="text-accent hover:underline"
                  >
                    Save recording
                  </button>
                </>
              )}
            </p>
            <div className="wave flex items-center gap-[2px] h-[30px] mt-2" aria-hidden="true">
              {bars.map((h, i) => (
                <i
                  key={i}
                  style={{
                    height: h,
                    animationDelay: `${(i % 9) * -0.13}s`,
                    animationPlayState: playback.playing ? "running" : "paused",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label="Remove file"
            title="Remove file"
            className="self-start p-1.5 rounded-lg text-faint hover:text-ink hover:bg-chip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-7 text-center">
          <div className="w-[46px] h-[46px] mx-auto mb-3 rounded-[14px] bg-chip grid place-items-center transition-transform group-hover:-translate-y-[3px]">
            <Upload className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm font-semibold text-ink">Drop your recording here</p>
          <p className="text-[12.5px] text-muted mt-1">
            or click to browse · MP3, M4A, WAV, MP4, WebM, FLAC or OGG
          </p>
          {recorder && (
            <div
              className="flex items-center justify-center gap-2.5 mt-4 text-xs text-faint"
              onClick={(e) => e.stopPropagation()}
            >
              or {recorder}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
