# Extract MP3 - Finder Quick Action
# Source of truth: projects/call-transcription/finder-quick-action/extract-mp3.sh
# install.sh embeds this file into the workflow bundle's document.wflow.
# Converts each selected video to a mono 64 kbps MP3 next to the original
# (speech-optimized; a 2-hour call comes out around 50 MB).

LOG=/tmp/extract-mp3.log
print -r -- "=== Extract MP3 run: $(date) ===" > "$LOG"

notify() {
  /usr/bin/osascript - "$1" <<'APPLESCRIPT' >/dev/null 2>&1
on run argv
	display notification (item 1 of argv) with title "Extract MP3"
end run
APPLESCRIPT
}

FFMPEG=/opt/homebrew/bin/ffmpeg
if [[ ! -x $FFMPEG ]]; then
  FFMPEG=$(command -v ffmpeg)
fi
if [[ -z $FFMPEG ]]; then
  notify "ffmpeg not found. Run: brew install ffmpeg"
  /usr/bin/afplay /System/Library/Sounds/Basso.aiff
  exit 1
fi

if (( $# == 0 )); then
  notify "No video files received."
  exit 0
fi

if (( $# == 1 )); then
  notify "Extracting MP3 from ${1:t}..."
else
  notify "Extracting MP3 from $# videos..."
fi

ok=0
failed=()
last_out=""

for f in "$@"; do
  base="${f%.*}"
  out="$base.mp3"
  n=2
  while [[ -e $out ]]; do
    out="$base $n.mp3"
    n=$(( n + 1 ))
  done
  print -r -- "--- $f -> $out" >> "$LOG"
  if "$FFMPEG" -nostdin -hide_banner -i "$f" -vn -ac 1 -b:a 64k "$out" >> "$LOG" 2>&1; then
    ok=$(( ok + 1 ))
    last_out="$out"
  else
    failed+=("${f:t}")
    rm -f -- "$out"
  fi
done

if (( ${#failed} == 0 )); then
  if (( ok == 1 )); then
    notify "Done: ${last_out:t}"
    /usr/bin/open -R "$last_out"
  else
    notify "Done: $ok MP3s created."
  fi
  /usr/bin/afplay /System/Library/Sounds/Glass.aiff >/dev/null 2>&1
else
  notify "Failed: ${(j:, :)failed} (details: /tmp/extract-mp3.log)"
  /usr/bin/afplay /System/Library/Sounds/Basso.aiff >/dev/null 2>&1
fi
