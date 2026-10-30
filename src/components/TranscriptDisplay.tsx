import type { Utterance } from "../lib/types";

// Readable on both the light and the dark look.
const SPEAKER_COLORS = ["#8b7cff", "#f59e0b", "#14b8a6", "#ec4899", "#0ea5e9", "#84cc16"];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Hebrew, Arabic and the scripts written like them (Persian, Urdu, Yiddish).
const RTL_LETTER = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const LTR_LETTER = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/g;

// Direction comes from the transcript itself, not the Language menu, so an
// Auto-detect run on a Hebrew call still reads right to left. English terms
// inside a Hebrew call don't tip it: the majority script decides.
function isRtlText(utterances: Utterance[]): boolean {
  const text = utterances.map((u) => u.text).join(" ");
  const rtl = text.match(RTL_LETTER)?.length ?? 0;
  const ltr = text.match(LTR_LETTER)?.length ?? 0;
  return rtl > ltr;
}

interface Props {
  utterances: Utterance[];
}

export function TranscriptDisplay({ utterances }: Props) {
  const isRtl = isRtlText(utterances);
  const speakerIds = [...new Set(utterances.map((u) => u.speaker))];

  function getSpeakerColor(speaker: string): string {
    const idx = speakerIds.indexOf(speaker);
    return SPEAKER_COLORS[idx % SPEAKER_COLORS.length];
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3.5 mb-2 text-[12.5px] text-muted">
        {speakerIds.map((id) => (
          <span key={id} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: getSpeakerColor(id) }} />
            Speaker {id}
          </span>
        ))}
      </div>
      <div className={isRtl ? "text-right" : "text-left"} dir={isRtl ? "rtl" : undefined}>
        {utterances.map((u, i) => {
          const color = getSpeakerColor(u.speaker);
          return (
            <div key={i} className="grid grid-cols-[34px_1fr] gap-3 px-2 py-3 rounded-xl transition-colors hover:bg-row">
              <div
                className="w-[30px] h-[30px] rounded-full grid place-items-center text-xs font-bold text-white"
                style={{ background: color }}
              >
                {u.speaker}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 text-[12.5px] font-semibold" style={{ color }}>
                  Speaker {u.speaker}
                  {/* Times always read left to right, even inside a Hebrew transcript. */}
                  <span className="font-medium text-faint tabular-nums" dir="ltr">
                    {formatTime(u.start)} - {formatTime(u.end)}
                  </span>
                </div>
                <p className={`mt-1 text-ink leading-[1.75] ${isRtl ? "font-hebrew text-[15px]" : "text-sm"}`}>
                  {u.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
