import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
} from "docx";
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

export async function exportDocx(
  utterances: Utterance[],
  audioDuration: number | null,
  recordingDate: string
): Promise<Blob> {
  const meta: TextRun[] = [];
  if (audioDuration) {
    meta.push(new TextRun({ text: "Duration: ", bold: true }));
    meta.push(new TextRun({ text: formatDuration(audioDuration * 1000) }));
  }
  const date = formatRecordingDate(recordingDate);
  if (date) {
    if (meta.length > 0) meta.push(new TextRun({ text: "  |  " }));
    meta.push(new TextRun({ text: "Date: ", bold: true }));
    meta.push(new TextRun({ text: date }));
  }

  const children: Paragraph[] = [
    new Paragraph({
      text: "Call Transcript",
      heading: HeadingLevel.HEADING_1,
    }),
    ...(meta.length > 0 ? [new Paragraph({ children: meta })] : []),
    new Paragraph({ text: "" }),
  ];

  for (const u of utterances) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Speaker ${u.speaker}`,
            bold: true,
          }),
          new TextRun({
            text: `  (${formatTime(u.start)} - ${formatTime(u.end)})`,
            color: "888888",
          }),
        ],
      }),
      new Paragraph({ text: u.text }),
      new Paragraph({ text: "" })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
