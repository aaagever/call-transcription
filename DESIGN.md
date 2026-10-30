# s2t design system, and how to bring it to t2s

s2t.joeleilat.com was redesigned on 2026-10-29. Joel wants the same look and the same UX fixes on its sibling, t2s.joeleilat.com (`../text-to-speech`). This file is the reference for that: what the design is made of, where each piece lives, what Joel liked and rejected along the way, and a step-by-step plan for t2s.

**See it first.** Open `design/mockup-2026-10-29.html` in a browser (the switch at the top right flips light and dark), then the live site. The code is the source of truth; the mockup shows the intent.

## 1. The building blocks

All files are under `src/` in this project. Both apps use React 19, Vite and Tailwind 4, so most of this copies across as is.

### Theme (copy first, everything else depends on it)
| Piece | Where | What it does |
|---|---|---|
| Color tokens | `index.css`, the `@theme inline` block and the two `:root[data-look=...]` blocks | One set of names for both looks: `page`, `ink`, `muted`, `faint`, `card`, `card-line`, `field`, `line`, `accent`, `accent-2`, `chip`, `ok`, `danger`, `danger-bg`, `divider`, `row`. Use them as utilities: `bg-card`, `text-ink`, `border-line`, `text-accent`. Dark accent `#8b7cff` + teal `#36d6c3`; light accent `#5b4cf0` + teal `#12a594`. |
| Fonts | `index.html` (Google Fonts link), `--font-sans` / `--font-hebrew` in `index.css` | Inter for everything; Heebo for Hebrew text (`font-hebrew`). |
| No-flash theme script | `index.html`, the inline `<script>` in `<head>` | Applies the saved theme (`localStorage.theme`) before React loads. |
| Theme switch | `components/ThemeToggle.tsx` | Sun / screen / moon. Follows the system until a choice is made, then remembers it. |
| Background | `.page-bg` in `index.css`, three `.blob` divs at the top of `App.tsx` | Dark: drifting violet / teal / purple glow plus a faint dot grid. Light: dot grid only. |
| Glass card | `.glass-card` in `index.css` | The frosted main card and the result card. |
| Field focus ring | `.field-focus` in `index.css` | Violet ring on any field wrapper while focused. |

### Components
| Component | File | Notes for t2s |
|---|---|---|
| Section heading with icon | `components/SectionLabel.tsx` | Small uppercase label with a lucide icon in accent color. Use for every section. |
| Model cards + phone deck | `components/ModelSelector.tsx` | Three cards on desktop; below 640px a deck (`ModelStack`) that fans the other cards out downward, tilted -2 / +2 degrees, pushing the form down. In t2s this is the natural replacement for the **Provider** segmented control (OpenAI / ElevenLabs / Gemini), each card with a short tag. |
| Key field | `components/ApiKeyInput.tsx` | Lock icon, provider name, masked text, green "Saved" when stored, eye only while typing. **Not `type="password"`** (see section 3). |
| Select field | `components/LanguageSelector.tsx` | Styled native `<select>` with a chevron. Pattern for t2s's Model and Voice selects. |
| Date as words | `components/RecordingDateInput.tsx` | Shows "October 29, 2026", opens the browser picker on click. Not needed in t2s. |
| Drop zone | `components/FileUploader.tsx` + `HaloFrame.tsx` + `IllosArt.tsx` + `assets/illos-uploads.svg` | Halo frame (glow behind a frosted surface, trail around the border on hover / focus / drag), the animated Illos drawing when empty, a file card with a full-width animated waveform when a file is in. Keyboard reachable. Drag enters and leaves are counted so the glow doesn't flicker. |
| Recorder button | `components/AudioRecorder.tsx` | Pill button inside the empty drop zone. t2s has no recording. |
| Primary button | `.go-button` in `index.css`, used in `App.tsx` | Violet-to-teal gradient with a moving shine while busy (`busy` class). |
| Progress | `components/TranscribeProgress.tsx`, `lib/elapsed.ts` | Steps (Upload / Transcribe / Done), running timer, bar. It reads the step from the status text; t2s's statuses are "Part X of Y", so adapt `readStatus` to fill the bar by parts. |
| Disabled reason | `disabledReason` in `App.tsx` | A line under the button saying why it is disabled (missing key, already done). Never only a tooltip. |
| Result card | bottom of `App.tsx` | Title with icon, chips (length, speakers, words, model), export buttons with the download icon inside the first. t2s: chips for length, cost estimate, model, voice; the player goes inside this card. |
| Transcript turns | `components/TranscriptDisplay.tsx` | Colored badge per speaker; direction from the text (`isRtlText`); times pinned left to right with `dir="ltr"`. In t2s, `isRtlText` can decide the text box's direction. |

### Small rules Joel set
- The waveform always animates, fills its row, and ends **7px** from the visible ✕ glyph (measured against the glyph, not its button).
- Phones use the **same see-through card colors** as desktop. No solid grey substitutes.
- Section spacing: one gap under each heading (`mb-2.5` on the label, no extra `space-y` on the section), 22px between sections.
- On phones the header subtitle is hidden so the title fits on one line.

## 2. Third-party pieces and licenses
- **Halo Dropzone** by cult/ui (MIT, 21st.dev): only the look was taken, rebuilt in CSS (`.halo-*` rules) and recolored. Credit is in `HaloFrame.tsx` and `index.css`.
- **Illos "File uploads" drawing** (Illos free license, https://illos.dev/license): free for commercial use, may be changed, no credit needed; not allowed to resell it as an asset or build a rival library. The license note is at the top of `assets/illos-uploads.svg`. The play logic in `IllosArt.tsx` is MIT (from @navedux's Illos Upload Dropzone). The drawing reads `--illos-dark`, `--illos-ground`, `--illos-ink` and `--illos-accent`; `.illos-art` in `index.css` maps them to the app's colors. Copying both files into t2s is fine under the license.
- **lucide-react 1.57.0**, exact-pinned. t2s has no icon library yet; add the same version.

## 3. Gotchas found while building this
- **Password managers fill `type="password"` fields.** t2s's `ApiKeyInput.tsx` (line ~86) has the same bug: fix it the same way (text field, `.masked`, `autoComplete="off"`, `data-1p-ignore`, `data-lpignore="true"`, `data-form-type="other"`).
- **Run Vite from the app's own folder.** Started from another folder, Tailwind scans the wrong files and silently drops classes. The production build is unaffected.
- **Keep `dangerouslySetInnerHTML`'s object outside the component.** In React 19 a new `{ __html }` object rewrites the element's contents on every render. For the Illos drawing that meant the first click on it did nothing: pressing the mouse focused the drop zone, the re-render replaced the drawing under the pointer, and the browser fired no click. A second click worked, since focus no longer changed. `IllosArt.tsx` uses a constant.
- **`clip-path` cuts off outer box-shadows.** That is why the chosen card in the phone deck has no clip.
- **Screenshots catch animations mid-way.** If a screenshot looks wrong right after a click or a reload, wait a second and take it again before changing code.
- **The browser pane's clipboard and downloads don't reach the Mac.** To take code from 21st.dev (signed in), read it from the page; public demo pages on `cdn.21st.dev` can be fetched with curl. Check a hash after copying anything long.
- **`prefers-reduced-motion`** stops every animation (a global rule in `index.css`); the Illos drawing also holds still. Expected, not a bug.

## 4. Porting to t2s, step by step
1. Read `../text-to-speech/CLAUDE.md`; t2s is fully static (no Functions), so `npm run dev` already works there.
2. Copy the theme: the `@theme inline` block, both `:root[data-look]` blocks, `body`, `.page-bg`, `.glass-card`, `.field-focus`, `.accent-gradient`, `.go-button`, `.wave`, `.rise`, `.masked`, the halo and illos rules, and the reduced-motion rule from `src/index.css`; the font link and theme script from `index.html`.
3. Add `lucide-react@1.57.0 --save-exact`, run `npm audit`.
4. Copy `ThemeToggle.tsx`, `SectionLabel.tsx`, `HaloFrame.tsx`, `IllosArt.tsx`, `assets/illos-uploads.svg` unchanged.
5. Rebuild `App.tsx`'s layout like s2t's: background blobs, header with logo + theme switch, one glass card with sectioned parts, then a result card.
6. Provider picker becomes cards (adapt `ModelSelector.tsx`, deck included). Key field: port `ApiKeyInput.tsx` including the autofill fix. Model and Voice: style like `LanguageSelector.tsx`.
7. Text box and file drop: put t2s's `FileUploader` inside `HaloFrame` with the Illos drawing; restyle `TextInput` with the field tokens.
8. Generate button: `.go-button` plus the progress component adapted to parts; the disabled-reason line.
9. Player: restyle `AudioPlayer.tsx` with the tokens inside the result card.
10. Build a mockup or compare with s2t side by side before shipping; check light, dark and a 375px-wide screen; then deploy and verify the live build.
