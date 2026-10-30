import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  /** Called with the recording and its length in seconds. */
  onRecordingComplete: (file: File, seconds: number) => void;
}

export function AudioRecorder({ onRecordingComplete }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `recording-${Date.now()}.webm`, {
          type: mimeType,
        });
        onRecordingComplete(file, (Date.now() - startedAtRef.current) / 1000);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      startedAtRef.current = Date.now();
      setRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      alert("Could not access microphone. Please check permissions.");
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors text-[13px] font-semibold"
          >
            <span className="w-2.5 h-2.5 bg-white rounded-[3px]" />
            Stop recording
          </button>
          <span className="inline-flex items-center gap-2 text-[13px] text-muted tabular-nums">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {formatDuration(duration)}
          </span>
        </>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="inline-flex items-center gap-2 rounded-full pl-2.5 pr-3.5 py-1.5 bg-chip text-ink border border-line hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] transition-colors text-[13px] font-semibold"
        >
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_0_4px_rgba(239,68,68,0.15)]" />
          Record
        </button>
      )}
    </div>
  );
}
