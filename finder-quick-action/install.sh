#!/bin/bash
# Build + install the "Extract MP3" Finder Quick Action.
# Safe to re-run any time (e.g. after editing extract-mp3.sh): it replaces the installed copy.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/Library/Services/Extract MP3.workflow"

rm -rf "$DEST"
mkdir -p "$HOME/Library/Services"
cp -R "$DIR/workflow-template/Extract MP3.workflow" "$DEST"

# Embed the conversion script into the workflow (plutil handles XML escaping)
plutil -replace actions.0.action.ActionParameters.COMMAND_STRING \
  -string "$(cat "$DIR/extract-mp3.sh")" \
  "$DEST/Contents/document.wflow"

plutil -lint "$DEST/Contents/document.wflow" >/dev/null
plutil -lint "$DEST/Contents/Info.plist" >/dev/null

# Register with the macOS Services system
/System/Library/CoreServices/pbs -update 2>/dev/null || true

echo "Installed: $DEST"
echo "First install only: right-click a video > Quick Actions > Customize... and check Extract MP3"
echo "Use it: right-click a video in Finder > Quick Actions > Extract MP3"
