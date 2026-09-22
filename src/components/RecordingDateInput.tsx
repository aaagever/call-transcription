interface Props {
  /** ISO calendar date ("YYYY-MM-DD"), or "" when unset. */
  value: string;
  /** True while the value is the audio file's modified date and the user has not touched it. */
  fromFile: boolean;
  onChange: (isoDate: string) => void;
}

export function RecordingDateInput({ value, fromFile, onChange }: Props) {
  let hint: string;
  if (!value) {
    hint = "Optional. Goes into the transcript header and the file name.";
  } else if (fromFile) {
    hint = "Prefilled from the file's modified date. Check it matches the meeting.";
  } else {
    hint = "Goes into the transcript header and the file name.";
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label
        htmlFor="recording-date"
        className="text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        Recording date
      </label>
      <input
        id="recording-date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear
        </button>
      ) : null}
      <span className="text-xs text-gray-400">{hint}</span>
    </div>
  );
}
