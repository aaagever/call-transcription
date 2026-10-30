# Call Transcription (s2t) - Project Context

A browser-based speech-to-text tool for Joel's calls, recordings and podcasts, live at **s2t.joeleilat.com** (Cloudflare Pages project `call-transcription`, public repo `aaagever/call-transcription`). Upload or record audio, pick a model, get a speaker-labeled transcript (Hebrew and English), export Markdown, TXT or Word. Sibling of `../text-to-speech` (t2s.joeleilat.com).

## Status (2026-10-29)
- **Live:** Soniox v5 as the default model next to AssemblyAI, the UX fixes, the light/dark redesign, the halo + Illos drop zone, the phone card deck for models, and the key-field autofill fix. Last commit `b4d5ead`, deployed and verified the same day.
- **Next:** port the same design to t2s. The full guide is `DESIGN.md` in this folder; the t2s backlog tracks it.

## Where things live
- `src/App.tsx` - state, layout, the transcribe flow (branches per model).
- `src/lib/soniox-api.ts` - Soniox client (browser-direct). `src/lib/api.ts` - AssemblyAI client (through Pages Functions) plus the shared error helpers.
- `src/lib/types.ts` - `SpeechModel`, `MODEL_PROVIDER` (the model decides the provider), shared shapes.
- `src/components/` - one file per UI piece; `src/index.css` holds the theme colors and every custom style.
- `functions/api/` - Pages Functions proxying AssemblyAI (it sends no CORS headers). R2 for files over 90 MB.
- `design/mockup-2026-10-29.html` - the clickable mockup Joel approved (light/dark switch at the top right). Open it in a browser.
- `DESIGN.md` - the design system and the step-by-step guide for bringing it to t2s.

## Commands
Prepend `export PATH="/Users/yoeleilat/.nvm/versions/node/v20.20.0/bin:$PATH"`.
- `npm run build` (tsc + vite), `npm run lint`, `npm run deploy` (build + `wrangler pages deploy dist`).
- `npm run dev` is broken: `wrangler pages dev -- npx vite` fails with "Specify either a directory OR a proxy command". For UI work run plain Vite from this folder: `node node_modules/vite/bin/vite.js --port 5194`. Soniox works there; AssemblyAI needs the Functions, so it does not.
- Deploy needs Wrangler signed in. If it fails with "Failed to fetch auth token: 400", Joel runs `npx wrangler login` here (it opens a browser).

## Hard rules and gotchas
- **Start Vite from this folder.** Tailwind finds classes by scanning from the current directory. Started from elsewhere (for example the engini client folder), it scanned the wrong tree, produced a 727 KB stylesheet and silently dropped half the app's classes. The production build is unaffected.
- **The API key field must not be `type="password"`.** Password managers treat it as a login and fill in a saved password a moment after it appears; Save would then store the wrong key. It is a text field masked with `-webkit-text-security` (`.masked` in index.css) plus `autoComplete="off"` and the 1Password / LastPass ignore attributes.
- **Keys live in localStorage per address**: `soniox-api-key`, `assemblyai-api-key`. A key saved on localhost does not exist on s2t.joeleilat.com. Other keys: `transcription-model` (last model), `theme` (light / dark / absent = system).
- **Soniox jobs must be cleaned up.** The client deletes the transcription and the uploaded file after every run (Soniox otherwise keeps them 30 days and caps an account at 2,000 transcriptions).
- **Joel's Soniox key** for command-line tests is in `~/.soniox_key`; never print it.
- **Text direction comes from the transcript text**, not the Language menu (`isRtlText` in `TranscriptDisplay.tsx`).
- **No test framework yet.** Checks so far: build, lint, and real runs in the browser (a 20-second clip of a podcast costs under a cent).
- **Lint has 3 pre-existing errors** in `functions/api/*` (empty interfaces). `npx eslint src` is clean.
- Git identity `aaagever` / `aaagever@users.noreply.github.com`. Exact-pinned dependencies. No em dashes.

## Doc index
- `DESIGN.md` - design system, component map, and the t2s port guide
- `roadmap.md` - milestones
- `backlog.md` - open items; finished items move to Done
- `decisions.md` - decision log with rationale
- `README.md` - public overview and setup
