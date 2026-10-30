# Backlog

Prioritized open items. Move finished items to `## Done` with a date. P0 = blocker; P1 = important, not blocking; P2 = nice-to-have.

## Tooling
- `P1` - **`npm run dev` fails** with Wrangler's "Specify either a directory OR a proxy command" (wrangler.toml sets `pages_build_output_dir` and the script also passes a proxy command). Until fixed, AssemblyAI cannot be tested locally.
- `P1` - **`npm audit`: 19 findings**, all in build tools (vite, wrangler, postcss and their dependencies), none in runtime code. Wrangler is on 4.72.0 (4.156.0 available).
- `P2` - **No test runner.** Add Vitest (the t2s sibling uses 4.1.10) for `normalizeTokens`, `isRtlText`, `formatDuration`, the export formats.
- `P2` - **Bundle is 611 KB** (Vite warns over 500 KB): lazy-load the Word export and the Illos drawing.
- `P2` - Fonts come from Google Fonts (one outside request); self-host Inter and Heebo if that matters.

## Product
- `P2` - **A real accuracy check** of Soniox against AssemblyAI: hand-check three 2-minute clips and compute errors per 100 words (method in the 2026-10-29 session notes: disagreements between engines, resolved by listening).
- `P2` - UX ideas discussed, not approved: keep the last transcript across reloads; name the speakers; click a timestamp to hear that moment; notify when done; remember the language; copy all; search; Cmd+Enter; warn before leaving mid-run; validate a key on save.
- `P2` - An unsupported file type still opens a browser `alert()`; show it inline instead.

## Done

### 2026-10-29
- Soniox v5 added, browser-direct, default model; model picker decides the provider (`785ec93`, `a0a941e`).
- UX fixes: text direction from the transcript; file shown inside the drop zone; reason under a disabled Transcribe; steps, timer and Soniox upload percent; Save recording and play-back for in-app recordings only (`326c024`).
- Light/dark redesign with lucide icons, matched to the mockup; waveform animated and full width (`88d0f3d`, `b35c53a`).
- Halo + Illos drop zone (`831a5e2`).
- Phone card deck for models; key field no longer autofilled by password managers (`b4d5ead`).
