# Roadmap

## Milestone 1 - Soniox and the redesign (DONE, 2026-10-29)
**Goal**: Better Hebrew transcripts, and an app that looks and feels good in light and dark.
**Tasks**: Soniox v5 as a provider; UX fixes to the existing flow; light/dark redesign matched to the approved mockup; halo + Illos drop zone; phone card deck for models; key-field autofill fix.
**Exit criterion**: Live on s2t.joeleilat.com and verified (done, commit `b4d5ead`).

## Milestone 2 - Bring the design to t2s
**Goal**: t2s.joeleilat.com gets the same look and the same fixes, so the two sibling apps match again.
**Tasks**: follow the port guide in `DESIGN.md`; tracked in `../text-to-speech/backlog.md`.
**Exit criterion**: t2s live with light/dark, the shared components, and the autofill fix.

## Milestone 3 - Maintenance
**Goal**: Keep the tooling healthy.
**Tasks**: fix `npm run dev`; update the build tools that `npm audit` flags; add a test runner for the pure helpers.
**Exit criterion**: `npm run dev` works, `npm audit` clean, tests run in CI or locally.
