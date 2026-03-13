import type { Utterance } from "./types";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} seconds`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""} ${seconds} second${seconds !== 1 ? "s" : ""}`;
}

export function exportTxt(
  utterances: Utterance[],
  audioDuration: number | null
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let txt = `Call Transcript\n`;
  if (audioDuration) {
    txt += `Duration: ${formatDuration(audioDuration * 1000)} | `;
  }
  txt += `Date: ${date}\n\n`;

  for (const u of utterances) {
    txt += `[${formatTime(u.start)} - ${formatTime(u.end)}] Speaker ${u.speaker}:\n`;
    txt += `${u.text}\n\n`;
  }

  return txt;
}
