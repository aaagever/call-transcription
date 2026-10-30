import { useEffect, useState } from "react";
import { formatElapsed } from "../lib/elapsed";

interface Props {
  /** The provider's latest status line, e.g. "Uploading audio... 42%". */
  status: string;
  /** When the run started (Date.now()). */
  startedAt: number;
}

const STEPS = ["Upload", "Transcribe", "Done"] as const;

// The providers report progress as status lines; the step and the upload
// percentage are read from them, so no provider needs a second callback.
function readStatus(status: string): { step: number; percent: number | null } {
  const percent = status.match(/(\d+)%/);
  const uploading = /^Uploading/i.test(status);
  return {
    step: uploading ? 0 : 1,
    percent: uploading && percent ? Number(percent[1]) : null,
  };
}

export function TranscribeProgress({ status, startedAt }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { step, percent } = readStatus(status);

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <span className={`h-px w-6 ${i <= step ? "bg-blue-400" : "bg-gray-200"}`} />}
            <span
              className={`flex items-center gap-1.5 ${
                i === step ? "text-blue-700 font-medium" : i < step ? "text-gray-500" : "text-gray-300"
              }`}
            >
              {i < step ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-3.5 h-3.5">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              ) : i === step ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <span className="w-2 h-2 rounded-full bg-current" />
              )}
              {label}
              {i === 0 && percent !== null && i === step && ` ${percent}%`}
            </span>
          </div>
        ))}
        <span className="ml-auto tabular-nums text-gray-500">{formatElapsed(now - startedAt)}</span>
      </div>
      {percent !== null && (
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-blue-500 transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      )}
      <p className="text-xs text-gray-500">{status}</p>
    </div>
  );
}
