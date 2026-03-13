# Call Transcription

A browser-based tool for transcribing audio files with speaker diarization. Upload a recording (or record one in-browser), get a speaker-labeled transcript, and export it as Markdown, plain text, or DOCX.

Powered by [AssemblyAI](https://www.assemblyai.com/) -- supports files up to 5GB with no chunking or splitting required.

## Features

- **Speaker diarization** -- automatically labels who said what (Speaker A, Speaker B, etc.)
- **Language auto-detection** -- or manually select from 99+ supported languages
- **Large file support** -- tested with 250MB+ files; no client-side splitting needed
- **In-browser recording** -- record audio directly using the MediaRecorder API
- **Export options** -- download transcripts as Markdown (.md), plain text (.txt), or Word (.docx)
- **BYO API key** -- your AssemblyAI key stays in localStorage, never stored server-side

## Tech Stack

- **Vite + React + TypeScript + Tailwind CSS** -- lightweight SPA, no SSR
- **Cloudflare Pages Functions** -- CORS proxy to AssemblyAI (keeps the API key out of browser requests)
- **AssemblyAI API** -- transcription with Universal-3-Pro + Universal-2 fallback

## Prerequisites

- Node.js 20+
- An [AssemblyAI API key](https://www.assemblyai.com/dashboard/signup) (free tier available)

## Setup

```bash
# Install dependencies
npm install

# Start the dev server (Vite + Wrangler for local Functions)
npm run dev
```

The app runs at `http://localhost:8788` (Wrangler proxies Vite).

## Usage

1. Enter your AssemblyAI API key (saved to localStorage)
2. Select a language or leave on "Auto-detect"
3. Upload an audio file (mp3, wav, m4a, mp4, flac, ogg, webm) or record one
4. Click **Transcribe**
5. Once complete, export the transcript in your preferred format

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
  App.tsx                    # Main app -- state management, UI composition
  components/
    ApiKeyInput.tsx          # API key field with localStorage persistence
    AudioRecorder.tsx        # Browser recording via MediaRecorder
    FileUploader.tsx         # Drag-and-drop file upload
    LanguageSelector.tsx     # Language dropdown (auto-detect + manual)
    TranscriptDisplay.tsx    # Renders speaker-labeled transcript
    ExportButtons.tsx        # MD / TXT / DOCX download buttons
  lib/
    api.ts                   # Upload, transcribe, poll functions
    types.ts                 # TypeScript interfaces
    languages.ts             # Supported language list
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

## Supported Audio Formats

mp3, mp4, wav, flac, ogg, webm, m4a, and more. See [AssemblyAI docs](https://www.assemblyai.com/docs/concepts/faq#what-audio-formats-are-supported) for the full list.

## License

Private.
