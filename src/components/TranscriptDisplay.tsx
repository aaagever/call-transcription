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

const RTL_LANGUAGES = new Set(["he", "ar", "fa", "ur", "yi"]);

interface Props {
  utterances: Utterance[];
  language?: string;
}

export function TranscriptDisplay({ utterances, language }: Props) {
  const isRtl = language ? RTL_LANGUAGES.has(language) : false;
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
            <span className="text-xs text-gray-400">
              {formatTime(u.start)} - {formatTime(u.end)}
            </span>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed">{u.text}</p>
        </div>
      ))}
    </div>
  );
}
