import { useRef } from "react";
import { X } from "lucide-react";
import { formatRecordingDate } from "../lib/recording-date";

interface Props {
  /** ISO calendar date ("YYYY-MM-DD"), or "" when unset. */
  value: string;
  /** True while the value is the audio file's modified date and the user has not touched it. */
  fromFile: boolean;
  onChange: (isoDate: string) => void;
  id?: string;
}

// Shows the date as words ("October 29, 2026"); clicking it opens the
// browser's own date picker from a hidden date input.
export function RecordingDateInput({ value, fromFile, onChange, id = "recording-date" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = formatRecordingDate(value);

  let hint: string;
  if (!value) {
    hint = "Optional. Goes into the transcript header and the file name.";
  } else if (fromFile) {
    hint = "Taken from the file's date. Check it matches the meeting.";
  } else {
    hint = "Goes into the transcript header and the file name.";
  }

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  return (
    <div
      title={hint}
      className="field-focus relative flex items-center h-11 pl-3 pr-1.5 rounded-xl bg-field border border-line transition-shadow"
    >
      <button
        type="button"
        onClick={openPicker}
        className={`flex-1 min-w-0 h-full text-left text-sm truncate ${label ? "text-ink" : "text-faint"}`}
      >
        {label ?? "Add a date"}
      </button>
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-label="Recording date"
        className="absolute left-3 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear date"
          title="Clear date"
          className="p-1.5 rounded-md text-faint hover:text-ink"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
