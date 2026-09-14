# B01 — Swing vertical slice (ugly, on the phone, with tests)
**Status:** ACTIVE · **Date:** 2026-09-14 · **Author:** Claude Design Chat · **Spec:** `docs/Nailhammer_Design_Doc.md` §2 (LOCKED), §10

## Outcome
One playable level on the phone, rectangles only: the hammer scrolls right over a strip of nails, drag-up/flick-down swings it, flush/hit/bent/whiff/missed all work per §2.3, fail restarts instantly. Every number in §2.2 lives in one config object and has a test.

## Build
1. **Pure game core** (`app/src/game/`, no React, no canvas imports):
   - `config.ts` — every §2.2 number, exported, named exactly as in the table.
   - `state.ts` — level state (scroll x, nails with permanent ids + status, hammer phase: `neutral | windup | strike | reset`, windup height, commit timestamp, attempt count, outcome flags).
   - `update.ts` — pure functions: `applyInput(state, pointerEvent, t)`, `tick(state, dt)`. No side effects, no Date.now() — time is passed in.
   - `judge.ts` — given impact time and nail positions, returns `flush | hit | bent | whiff`; `missed` is raised by `tick` when a nail passes the hammer un-hit.
2. **Input layer** (`app/src/input/`): pointer events only. Track vertical travel since pointerdown; upward travel → windup (clamped to cap); reversal ≥ commit threshold → commit event. Log the timestamp from the event, not from the handler.
3. **Render layer** (`app/src/render/`): canvas, portrait 390×844 logical, DPR-scaled. Hammer = rectangle whose y follows windup height; strike arc = ease-in from raised to impact over the delay; nails = rectangles, status coloured (proud grey, sunk green, flush gold, bent red). Surface = one line. Progress bar top, attempt counter top-left. Ugly is correct.
4. **Level 1**: hard-coded strip of 24 nails, 64 px wide each, spacing pattern `1,1,1,2,1,1,1,2,1,1,0.5,0.5,1,2,1,1,1,1,0.5,0.5,0.5,1,2,1` (units of nail-width gap). Ids `n001…n024`.
5. **Restart**: on `bent` or `missed`, reset state to level start, attempt++ , ≤ 500 ms. No screen, no button.
6. **Debug overlay** (toggle by tapping the attempt counter): shows last impact delta in ms vs nearest nail, and a live latency number = (frame time − pointer event time) averaged over the last 30 events. This is how we tune.
7. **Placeholder audio**: three distinct beeps (flush / hit / whiff) and a buzz (fail) via WebAudio. Vibration API `navigator.vibrate(10)` on hit, `vibrate(30)` on flush, if available.

## Tests (Vitest, all must pass; these ARE the spec)
- `config` exports match §2.2 values exactly (one assertion per number).
- Reversal of 11 px does not commit; 12 px does.
- Impact occurs exactly `commitToImpactMs` after commit regardless of windup height.
- Judge: delta 0 → flush; 20 → flush; 21 → hit; 55 → hit; 56 with overlap → bent; no overlap → whiff.
- A nail passing the hammer un-hit raises `missed` and triggers restart with attempt+1 and all nails reset to proud.
- Windup accepted at 40 ms into reset, rejected at 39 ms.
- Level 1 has 24 nails with unique ids.
- Restart path completes inside one tick (no async waits).

## Phone test plan (Tony)
1. Open on iPhone via `vite --host`. Portrait. Add to Home Screen so Safari chrome is gone.
2. Play level 1 ten attempts. Report in plain words: does the strike feel late/early, does the windup feel connected to the finger, does restart feel instant.
3. Tap the attempt counter, read the latency number, report it.

## DESIGN-OPEN allowed
- Exact ease curve of the strike arc (use ease-in quad, flag it).
- Windup-to-y mapping on screen (use 1:1 px, flag it).
Anything else missing: placeholder + `// DESIGN-OPEN`, name it in the PR.
