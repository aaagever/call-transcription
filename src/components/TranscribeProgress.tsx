import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
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
            {i > 0 && <span className={`h-px w-6 ${i <= step ? "bg-accent" : "bg-line"}`} />}
            <span
              className={`flex items-center gap-1.5 ${
                i === step ? "text-accent font-semibold" : i < step ? "text-muted" : "text-faint"
              }`}
            >
              {i < step ? (
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              ) : i === step ? (
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current" />
              )}
              {label}
              {i === 0 && percent !== null && i === step && ` ${percent}%`}
            </span>
          </div>
        ))}
        <span className="ml-auto tabular-nums text-muted">{formatElapsed(now - startedAt)}</span>
      </div>
      <div className="h-1 rounded-full bg-chip overflow-hidden">
        <div
          className="h-full rounded-full accent-gradient transition-[width] duration-500"
          // Upload fills the first third by its own percentage; transcription
          // has no percentage, so it holds at two thirds until done.
          style={{ width: `${step === 0 ? Math.round((percent ?? 0) / 3) : 66}%` }}
        />
      </div>
      <p className="text-xs text-muted">{status}</p>
    </div>
  );
}
