# Decision Log

| # | Decision | Why |
|---|---|---|
| 1 | Soniox v5 is the default model (2026-10-29). | On a 48-minute Hebrew podcast it disagreed with the other two engines half as often as AssemblyAI (44 vs 89 word spots), dropped no phrases (AssemblyAI dropped 9), separated the speakers correctly, and costs about $0.10 an hour. Not yet confirmed by ear (see backlog). |
| 2 | Soniox is called straight from the browser; AssemblyAI stays behind the Pages Functions proxy. | Soniox sends CORS headers (checked from the s2t origin, 2026-10-29); AssemblyAI does not. Direct calls also avoid Cloudflare's 100 MB request limit and the R2 detour. |
| 3 | One Model list; the model decides the provider and which key field shows. The last model is remembered, Soniox the first time. | One choice instead of two, and the key field always matches what will be called. |
| 4 | Text direction is read from the transcript's letters, not the Language menu. | With Auto-detect, Hebrew came out left to right. Majority script decides, so English terms inside Hebrew don't flip it. |
| 5 | Light and dark are CSS variables on `<html data-look>`, set before first paint, following the system until Joel picks one. | No flash of the wrong theme, and components use one set of color names (`bg-card`, `text-ink`, ...) for both looks. |
| 6 | Icons from `lucide-react` (1.57.0, pinned, no dependencies); animations in plain CSS, no `motion`. | Halo Dropzone's effects (drifting glow, border trail) rebuild in CSS, so the animation library would have added weight for nothing. |
| 7 | The API key field is a masked text field, not `type="password"`. | Password managers filled a saved password into it after a model switch, and Save would have stored that as the key. |
| 8 | The drop zone combines Halo Dropzone's frame (cult/ui, MIT) with the Illos "File uploads" drawing (Illos free license). | Joel's pick of the 21st.dev options. The license allows commercial use and changes without credit; the note is kept in the SVG file. |
| 9 | The file card's waveform is decoration shaped from the file name, not the real audio. | Decoding a 48-minute file just to draw it would cost seconds and memory. It fills the row and ends exactly 7px from the remove button's glyph (Joel's call). |
| 10 | On phones the model cards are a deck with the same see-through cards as desktop; cards behind are clipped to a peeking strip. | Joel's design. Solid grey cards (the first version) broke the look; clipping keeps the cards behind from showing through. |
| 11 | Build visual changes as a clickable mockup first, then match the app to it side by side. | The first redesign drifted from the mockup ("doesn't match the mockup"); comparing both in the same state caught every difference. |
