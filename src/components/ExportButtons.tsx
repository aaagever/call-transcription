import { saveAs } from "file-saver";
import { Download } from "lucide-react";
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
  /** Name of the audio file that was transcribed; the downloads are named after it. */
  sourceFileName: string;
}

export function ExportButtons({
  utterances,
  audioDuration,
  recordingDate,
  sourceFileName,
}: Props) {
  function downloadMarkdown() {
    const content = exportMarkdown(utterances, audioDuration, recordingDate);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, transcriptFileName(sourceFileName, recordingDate, "md"));
  }

  function downloadTxt() {
    const content = exportTxt(utterances, audioDuration, recordingDate);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, transcriptFileName(sourceFileName, recordingDate, "txt"));
  }

  async function downloadDocx() {
    const blob = await exportDocx(utterances, audioDuration, recordingDate);
    saveAs(blob, transcriptFileName(sourceFileName, recordingDate, "docx"));
  }

  const btnClass =
    "inline-flex items-center gap-1.5 px-3 py-[7px] text-[12.5px] leading-tight font-semibold rounded-[10px] bg-chip text-ink border border-line hover:border-accent transition-colors";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={downloadMarkdown} className={btnClass}>
        <Download className="w-[13px] h-[13px]" strokeWidth={2.2} />
        Markdown
      </button>
      <button type="button" onClick={downloadTxt} className={btnClass}>
        TXT
      </button>
      <button type="button" onClick={downloadDocx} className={btnClass}>
        Word
      </button>
    </div>
  );
}
