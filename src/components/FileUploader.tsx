import { useRef, useState } from "react";

const ACCEPTED_FORMATS = [
  ".mp3", ".mp4", ".m4a", ".wav", ".webm",
  ".flac", ".ogg", ".mpeg", ".mpga",
];

interface Props {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
}

export function FileUploader({ onFileSelect, currentFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
        <p className="text-gray-600 text-sm">
          Drop an audio file here or click to browse
        </p>
        <p className="text-gray-400 text-xs mt-1">
          MP3, MP4, M4A, WAV, WebM, FLAC, OGG
        </p>
      </div>
      {currentFile && (
        <div className="flex items-center gap-2 mt-2">
          <p className="text-sm text-gray-600">
            Selected: <span className="font-medium">{currentFile.name}</span>{" "}
            ({formatSize(currentFile.size)})
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const url = URL.createObjectURL(currentFile);
              const a = document.createElement("a");
              a.href = url;
              a.download = currentFile.name;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
}
