import { saveAs } from "file-saver";
import type { Utterance } from "../lib/types";
import { exportMarkdown } from "../lib/export-markdown";
import { exportTxt } from "../lib/export-txt";
import { exportDocx } from "../lib/export-docx";

interface Props {
  utterances: Utterance[];
  audioDuration: number | null;
}

export function ExportButtons({ utterances, audioDuration }: Props) {
  function downloadMarkdown() {
    const content = exportMarkdown(utterances, audioDuration);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, "transcript.md");
  }

  function downloadTxt() {
    const content = exportTxt(utterances, audioDuration);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "transcript.txt");
  }

  async function downloadDocx() {
    const blob = await exportDocx(utterances, audioDuration);
    saveAs(blob, "transcript.docx");
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
