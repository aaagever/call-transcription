import type { Utterance } from "./types";
import { formatRecordingDate } from "./recording-date";

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
  audioDuration: number | null,
  recordingDate: string
): string {
  const meta: string[] = [];
  if (audioDuration) {
    meta.push(`**Duration:** ${formatDuration(audioDuration * 1000)}`);
  }
  const date = formatRecordingDate(recordingDate);
  if (date) {
    meta.push(`**Date:** ${date}`);
  }

  let md = `# Call Transcript\n`;
  if (meta.length > 0) {
    md += `${meta.join(" | ")}\n`;
  }
  md += `\n---\n\n`;

  for (const u of utterances) {
    md += `**Speaker ${u.speaker}** (${formatTime(u.start)} - ${formatTime(u.end)})\n`;
    md += `${u.text}\n\n`;
  }

  return md;
}
