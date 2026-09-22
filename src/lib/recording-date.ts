// Helpers for the recording (meeting) date the user sets in the UI.
//
// The date travels as an ISO calendar date string ("YYYY-MM-DD"), exactly as
// <input type="date"> produces it. Keeping it a string avoids the timezone
// shift you get from new Date("2026-09-15"), which parses as UTC midnight.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a well-formed "YYYY-MM-DD" string. */
export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

/**
 * Local calendar date of a timestamp as "YYYY-MM-DD".
 * Used to prefill the field from an audio file's modified time.
 */
export function toIsoDate(timestampMs: number): string {
  if (!Number.isFinite(timestampMs)) return "";
  const d = new Date(timestampMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * "2026-09-15" -> "September 15, 2026" (the format the exports always used).
 * Returns null when no valid date is set, so callers can omit the line.
 */
export function formatRecordingDate(isoDate: string): string | null {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "client-call.mp3" -> "client-call"; a name without a dot is returned as is. */
function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Download name for an export: the audio file's own name (minus its
 * extension), then "transcript", then the recording date when one is set.
 *   ("client-call.mp3", "2026-09-15", "md") -> "client-call-transcript-2026-09-15.md"
 *   ("client-call.mp3", "",           "md") -> "client-call-transcript.md"
 *   ("",                "2026-09-15", "md") -> "transcript-2026-09-15.md"
 */
export function transcriptFileName(
  sourceFileName: string,
  isoDate: string,
  extension: string
): string {
  const parts = [
    stripExtension(sourceFileName).trim(),
    "transcript",
    isIsoDate(isoDate) ? isoDate : "",
  ].filter((part) => part !== "");
  return `${parts.join("-")}.${extension}`;
}
