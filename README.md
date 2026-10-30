# Call Transcription

A browser-based tool for transcribing audio files with speaker diarization. Upload a recording (or record one in-browser), get a speaker-labeled transcript, and export it as Markdown, plain text, or DOCX.

Powered by [Soniox](https://soniox.com/) (the default, best for Hebrew) or [AssemblyAI](https://www.assemblyai.com/), chosen in the Model dropdown. No chunking or splitting required.

Design system and the guide for bringing it to the sibling t2s app: [DESIGN.md](DESIGN.md). Working notes: [CLAUDE.md](CLAUDE.md).

## Features

- **Speaker diarization** -- automatically labels who said what (Speaker A, Speaker B, etc.)
- **Language auto-detection** -- or manually select from 99+ supported languages
- **Large file support** -- tested with 250MB+ files; no client-side splitting needed
- **In-browser recording** -- record audio directly using the MediaRecorder API
- **Export options** -- download transcripts as Markdown (.md), plain text (.txt), or Word (.docx)
- **Recording date** -- set the date of the meeting or recording once; it goes into the transcript header and the download file names, which keep the audio file's own name (`client-call-transcript-2026-09-15.md`). Prefilled from the audio file's modified date, editable
- **Two providers** -- Soniox v5, AssemblyAI Universal-3.5 Pro or Universal-2, picked from one Model dropdown. The app remembers the last model used
- **BYO API keys** -- one key per provider, kept in localStorage, never stored server-side
- **Light and dark mode** -- follows the system setting by default; the sun / screen / moon switch in the header picks one and remembers it

## Tech Stack

- **Vite + React + TypeScript + Tailwind CSS** -- lightweight SPA, no SSR. Both looks are CSS variables in `src/index.css`, switched by `data-look` on `<html>`; icons from `lucide-react`
- **Cloudflare Pages Functions** -- CORS proxy to AssemblyAI, which sends no CORS headers
- **AssemblyAI API** -- transcription with Universal-3.5 Pro + Universal-2 fallback
- **Soniox API** -- `stt-async-v5`, called directly from the browser (Soniox sends CORS headers; checked 2026-10-29)

## Prerequisites

- Node.js 20+
- A [Soniox API key](https://console.soniox.com/) (pay as you go, about $0.10 per audio hour) and/or an [AssemblyAI API key](https://www.assemblyai.com/dashboard/signup) (free tier available)

## Setup

```bash
# Install dependencies
npm install

# Start the dev server (Vite + Wrangler for local Functions)
npm run dev
```

The app runs at `http://localhost:8788` (Wrangler proxies Vite).

## Usage

1. Pick a model, then enter that provider's API key (saved to localStorage)
2. Select a language or leave on "Auto-detect". For Soniox the language is a hint, sent together with English
3. Upload an audio file (mp3, wav, m4a, mp4, flac, ogg, webm) or record one
4. Check the **Recording date** (prefilled from the file's modified date) and fix it if the meeting was on another day. Leave it empty to export without a date
5. Click **Transcribe**
6. Once complete, export the transcript in your preferred format

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Cloudflare Functions |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally via Wrangler |
| `npm run deploy` | Build and deploy to Cloudflare Pages |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  App.tsx                    # Main app -- state management, layout
  index.css                  # Light/dark color tokens and every custom style
  assets/illos-uploads.svg   # Illos drawing (Illos free license, note inside)
  components/
    ApiKeyInput.tsx          # Masked key field (not type=password, so password managers skip it)
    AudioRecorder.tsx        # Browser recording via MediaRecorder
    FileUploader.tsx         # Drop zone: halo frame, Illos drawing, file card with waveform
    HaloFrame.tsx            # Glowing frame around the drop zone
    IllosArt.tsx             # The animated Illos drawing, looping while on screen
    LanguageSelector.tsx     # Language dropdown (auto-detect + manual)
    ModelSelector.tsx        # Model cards; a card deck on phones; the model sets the provider
    RecordingDateInput.tsx   # Date of the meeting/recording (prefilled from the file)
    SectionLabel.tsx         # Section heading with an icon
    ThemeToggle.tsx          # Light / system / dark switch
    TranscribeProgress.tsx   # Steps, timer and progress bar while running
    TranscriptDisplay.tsx    # Speaker-labeled transcript; direction read from the text
    ExportButtons.tsx        # MD / TXT / DOCX download buttons
  lib/
    api.ts                   # AssemblyAI upload, transcribe, poll; shared error helpers
    soniox-api.ts            # Soniox: upload, transcribe, poll, tokens to utterances, cleanup
    elapsed.ts               # Run-time formatting
    types.ts                 # TypeScript interfaces
    languages.ts             # Supported language list
    recording-date.ts        # Recording date helpers (format, file name)
    export-markdown.ts       # Transcript to Markdown
    export-txt.ts            # Transcript to plain text
    export-docx.ts           # Transcript to .docx
functions/
  api/
    upload.ts                # Proxy: file upload to AssemblyAI
    transcribe.ts            # Proxy: start transcription job
    transcript/[id].ts       # Proxy: poll for transcription result
```

## Deployment

The app deploys as a static site + Cloudflare Pages Functions:

```bash
npm run deploy
```

This builds the frontend and deploys everything (static assets + functions) to Cloudflare Pages. You can also connect a Git repo for automatic deploys on push.

## How It Works

```
Browser                     Cloudflare Function          AssemblyAI
-------                     ------------------           ----------
1. Upload audio ----------> /api/upload ----------------> POST /v2/upload
2. Start transcription ----> /api/transcribe ------------> POST /v2/transcript
3. Poll every 3s ----------> /api/transcript/:id --------> GET /v2/transcript/:id
```

The Cloudflare Function acts as a CORS proxy -- it receives the API key from the browser via a header and forwards it to AssemblyAI. The key is never stored server-side.

Soniox needs no proxy, so the browser talks to it directly:

```
Browser                                Soniox
-------                                ------
1. Upload audio ---------------------> POST /v1/files
2. Start transcription --------------> POST /v1/transcriptions (stt-async-v5, speaker diarization)
3. Poll every 3s --------------------> GET /v1/transcriptions/:id
4. Fetch the result -----------------> GET /v1/transcriptions/:id/transcript
5. Delete the job and the file ------> DELETE (Soniox otherwise keeps them for 30 days)
```

Soniox caps a file at 300 minutes. It writes English terms in Latin letters and numbers as digits.

## Supported Audio Formats

mp3, mp4, wav, flac, ogg, webm, m4a, and more. See [AssemblyAI docs](https://www.assemblyai.com/docs/concepts/faq#what-audio-formats-are-supported) for the full list.

## License

Private.
