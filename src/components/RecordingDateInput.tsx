interface Props {
  /** ISO calendar date ("YYYY-MM-DD"), or "" when unset. */
  value: string;
  /** True while the value is the audio file's modified date and the user has not touched it. */
  fromFile: boolean;
  onChange: (isoDate: string) => void;
  id?: string;
}

export function RecordingDateInput({ value, fromFile, onChange, id = "recording-date" }: Props) {
  let hint: string;
  if (!value) {
    hint = "Optional. Goes into the transcript header and the file name.";
  } else if (fromFile) {
    hint = "From the file's date. Check it matches the meeting.";
  } else {
    hint = "Goes into the transcript header and the file name.";
  }

  return (
    <div>
      <div className="field-focus flex items-center gap-2 h-11 pl-3 pr-2 rounded-xl bg-field border border-line transition-shadow">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-ink"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-faint hover:text-ink px-1.5"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-faint">{hint}</p>
    </div>
  );
}
