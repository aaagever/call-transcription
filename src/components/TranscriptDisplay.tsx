import type { Utterance } from "../lib/types";

const SPEAKER_COLORS = [
  "text-blue-700",
  "text-emerald-700",
  "text-purple-700",
  "text-orange-700",
  "text-pink-700",
  "text-teal-700",
];

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
    <div className={`space-y-4 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : undefined}>
      {utterances.map((u, i) => (
        <div key={i}>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`font-semibold text-sm ${getSpeakerColor(u.speaker)}`}>
              Speaker {u.speaker}
            </span>
            {/* Times always read left to right, even inside a Hebrew transcript. */}
            <span className="text-xs text-gray-400" dir="ltr">
              {formatTime(u.start)} - {formatTime(u.end)}
            </span>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed">{u.text}</p>
        </div>
      ))}
    </div>
  );
}
