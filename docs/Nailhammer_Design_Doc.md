# Nailhammer — Game Design Document
*LOCKED = decided. OPEN = still to resolve. PARKED = shelved. Later sections supersede earlier where noted. `docs/*_Lock.md` win over this doc where newer.*

## 1. The game in one breath (LOCKED 2026-09-14)
**Geometry Dash with a hammer.** Portrait, one finger, auto-scrolling right. The player *is* the hammer — no character holding it. Nails stick up out of planks, roof lines, fence rails and decks. Drag up to wind the hammer up, flick down to strike; a fixed arc brings it down onto the nail. Miss or bend a nail → instant restart, attempt counter ticks, back in the level in under a second. Levels are short, hand-built, rhythmic. Tone: silly and fun — comedy from squash-and-stretch, sound and dumb consequences, never from text on screen.

Touchstones: Geometry Dash (auto-scroll, one input, die-restart-instantly, learn the level), Rhythm Heaven (tap windows that feel musical).

Platform: iOS phone, portrait 390×844 reference. Built as a web app (Vite + React + canvas) for fast feel iteration; wrapped for the App Store later. Native port stays on the table if feel demands it — see §10.

## 2. Core structure & loop (LOCKED 2026-09-14)
### 2.1 The swing — two halves, one of them fixed
- **Windup = your finger.** Drag up and the hammer rises 1:1 with the finger, up to the windup cap. Hold as long as you like. No timing lives here.
- **Strike = fixed arc.** When the finger reverses and moves down past the commit threshold, the hammer *commits*: it comes down on a fixed curve and impacts at a fixed delay after commit. Cannot be cancelled. Impact tests whether a nail head is under the hammer.
- **Reset is automatic.** After impact the hammer returns to neutral in a fixed time. The next windup is accepted before reset finishes (input buffered) so fast strips are possible.
- A partial windup still strikes. Windup height does not change the strike delay (v1 — see OPEN 9.2).

### 2.2 Starting numbers (all tunable; every number is asserted by a unit test)
| Parameter | Value |
|---|---|
| Commit threshold | 12 px of downward finger travel after any upward travel |
| Commit → impact delay | **140 ms** |
| Hit window | ±55 ms around the moment the nail center is under the hammer |
| Flush (perfect) window | ±20 ms — bonus + bigger sound |
| Reset to neutral | 120 ms; next windup accepted from 40 ms into reset |
| Windup cap | 320 px of finger travel |
| Scroll speed, level 1 | 1 nail-width (64 px) per 400 ms = 160 px/s |
| Restart after fail | ≤ 500 ms from fail to first frame of the new attempt |

### 2.3 Outcomes of a strike
| Case | Result |
|---|---|
| Impact inside flush window | **Flush.** Nail sinks fully. Bonus. |
| Impact inside hit window, outside flush | **Hit.** Nail sinks. |
| Impact outside hit window but nail head overlaps hammer | **Bent nail.** Fail → restart. |
| Impact with no nail under the hammer | **Whiff.** Not a fail. Hammer bonks the surface, silly sound, play continues. |
| A nail scrolls past the hammer un-hit | **Missed nail.** Fail → restart. |

Whiffs are not fails on purpose: punishing the air makes the game mean. Only the nails judge you.

### 2.4 Run structure
- A level is an authored strip of nails on surfaces. Level ends when the last nail is passed. Win = every nail hit.
- Fail = instant restart of the same level from the top (Geometry Dash rule). Attempt counter persists per level.
- Progress bar across the top, 0–100% of level length (Geometry Dash rule). The bar is the player's memory of how far they got.

## 3. Presentation & UI structure (OPEN)
- Screens: Title → Level select → Play (with progress bar, attempt counter) → Win screen. Nothing else in v1.
- Art rule (LOCKED): silhouettes must read at 1/6 screen width; nail head is the highest-contrast thing on screen; flat color, thick outlines; comedy from motion and sound, not text.
- Haptics on impact (LOCKED as intent; web build uses Vibration API where available, native port gets Core Haptics).

## 4. Lore / setting canon (PARKED)
None needed for v1. Surfaces (plank, roof, fence, deck) are the "setting."

## 5. Player fantasy — why you play (LOCKED)
A real carpenter's rhythm, on a phone. Every level is a little song you learn with your thumb; flush hits sound and feel *right*. You retry because the restart is instant and the level is short, not because the game nags you.

## 6. Character / progression systems (OPEN)
No characters. Progression = levels unlocked in order, attempt counts, flush % per level. Cosmetic hammers PARKED.

## 7. Loot & economy (LOCKED principle)
No currency in v1. If monetization ever exists it is a one-time unlock or cosmetics. **Never** pay-to-win, never ads that interrupt a level, never energy/lives.

## 8. Gameplay modes & timing spec
See §2.2 for numbers. Modes beyond the level list are PARKED (practice mode = OPEN 9.3).

## 9. OUTSTANDING / FLAGGED
1. **Tune the 140 ms.** Found on the phone through feel rounds. Everything in §2.2 is a starting number.
2. Does windup height matter? (bigger windup = later impact but flush window grows?) Decide after 2 feel rounds on the fixed version.
3. Practice mode with checkpoints (Geometry Dash has it; likely needed once levels exceed 60 s).
4. Level speed per level / speed changes mid-level.
5. Surfaces that change the nail (e.g. hardwood needs two hits) — v2 idea, PARKED until 5 levels exist.
6. Sound design pass — placeholder beeps in the slice.
7. Measure Safari input latency on Tony's phone and fold it into §2.2.

## 10. HARD "NEVER" LIST (LOCKED 2026-09-14)
1. NEVER more than one finger. No buttons during play.
2. NEVER a variable strike arc — the down-stroke is the same every time. Timing is learnable or the game is broken.
3. NEVER fail the player for a whiff. Only nails judge.
4. NEVER a restart slower than 500 ms.
5. NEVER text jokes on screen — comedy is motion and sound.
6. NEVER pay-to-win, energy, lives, or ads inside a level.
7. NEVER invent a mechanic in code — `// DESIGN-OPEN` placeholder, flag it in the PR.
8. NEVER lose the native-port option: game logic stays pure and framework-free (state + updaters), rendering and input are thin layers.
9. NEVER ship a number without a unit test asserting it.
