import { saveAs } from "file-saver";
import type { Utterance } from "../lib/types";
import { exportMarkdown } from "../lib/export-markdown";
import { exportTxt } from "../lib/export-txt";
import { exportDocx } from "../lib/export-docx";
import { transcriptFileName } from "../lib/recording-date";

interface Props {
  utterances: Utterance[];
  audioDuration: number | null;
  /** ISO calendar date ("YYYY-MM-DD") of the recording, or "" when unset. */
  recordingDate: string;
}

export function ExportButtons({ utterances, audioDuration, recordingDate }: Props) {
  function downloadMarkdown() {
    const content = exportMarkdown(utterances, audioDuration, recordingDate);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, transcriptFileName("md", recordingDate));
  }

  function downloadTxt() {
    const content = exportTxt(utterances, audioDuration, recordingDate);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, transcriptFileName("txt", recordingDate));
  }

  async function downloadDocx() {
    const blob = await exportDocx(utterances, audioDuration, recordingDate);
    saveAs(blob, transcriptFileName("docx", recordingDate));
  }

  const btnClass =
    "px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Download:</span>
      <button onClick={downloadMarkdown} className={btnClass}>
        Markdown
      </button>
      <button onClick={downloadTxt} className={btnClass}>
        Text
      </button>
      <button onClick={downloadDocx} className={btnClass}>
        DOCX
      </button>
    </div>
  );
}
