# Extract MP3 - Finder Quick Action

Right-click any video in Finder > **Quick Actions** > **Extract MP3**. A speech-optimized MP3 (mono, 64 kbps) appears next to the video, with a notification and sound when done. A 2-hour recording comes out around 50 MB, small enough to upload to [s2t.joeleilat.com](https://s2t.joeleilat.com) instead of a 1.5 GB video.

Works on any video type macOS recognizes (mp4, mov, mkv, webm...), single or multi-select. Never overwrites: if `Call.mp3` exists, it writes `Call 2.mp3`, `Call 3.mp3`, etc.

## Install

```bash
./install.sh
```

Then enable it once (macOS does not auto-enable newly installed quick actions): right-click any video > Quick Actions > **Customize...** > check **Extract MP3**.

Requires ffmpeg (`brew install ffmpeg`, already installed on this machine). Re-run `install.sh` after any edit to `extract-mp3.sh`; the enable step does not need repeating.

The first run may ask permission to send notifications. Allow it.

## Files

- `extract-mp3.sh` - the actual conversion script (edit this one)
- `workflow-template/Extract MP3.workflow/` - the Quick Action bundle skeleton; `install.sh` copies it to `~/Library/Services/` and embeds the script into it
- ffmpeg output from the last run is logged to `/tmp/extract-mp3.log`

## Tweaks

Edit `extract-mp3.sh`, then re-run `install.sh`:

- Higher quality (e.g. for listening, not just transcription): replace `-ac 1 -b:a 64k` with `-q:a 2` (stereo, ~190 kbps VBR)
- Different bitrate: change `64k` (e.g. `96k`, `128k`)

## Uninstall

```bash
rm -rf ~/Library/Services/"Extract MP3.workflow"
```

## Troubleshooting

- **Menu item missing** under Quick Actions: run `/System/Library/CoreServices/pbs -update`, then close and reopen the Finder window. Still missing: check System Settings > General > Login Items & Extensions > Finder (Quick Actions) and make sure Extract MP3 is enabled, or log out and back in.
- **Nothing happens / failure sound**: check `/tmp/extract-mp3.log` for the ffmpeg error.
- **No notification**: System Settings > Notifications > allow notifications from Automator/Script Editor. The Glass/Basso completion sounds and the Finder reveal work regardless.
