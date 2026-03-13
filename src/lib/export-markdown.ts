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

export function exportMarkdown(
  utterances: Utterance[],
  audioDuration: number | null
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let md = `# Call Transcript\n`;
  if (audioDuration) {
    md += `**Duration:** ${formatDuration(audioDuration * 1000)} | `;
  }
  md += `**Date:** ${date}\n\n---\n\n`;

  for (const u of utterances) {
    md += `**Speaker ${u.speaker}** (${formatTime(u.start)} - ${formatTime(u.end)})\n`;
    md += `${u.text}\n\n`;
  }

  return md;
}
