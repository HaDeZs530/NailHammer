# Nailhammer — Session Log
Transferable memory so any agent can pick up without re-deriving locks from chat.

**Repo:** `HaDeZs530/Nailhammer` · **Agent split:** Design Chat = design/locks/briefs; Claude Code = code; other tools = art.

## Chronology
- **2026-09-14:** Project created from PROCESS_TEMPLATE.
- **2026-09-14 (Claude Code) DONE — PR #1 Scaffold:** `app/` = Vite 8 + React 19 + TypeScript (strict), StrictMode on, Vitest, ESLint (typescript-eslint + react-hooks + react-refresh). One full-screen portrait `<canvas>` (`GameCanvas.tsx`): DPR-aware sizing, Pointer Events only (pointers tracked by `pointerId`, `touch-action: none`), black screen + FPS counter, no game logic. Tests: `build OK` smoke + FPS meter (4 pass). CI (`.github/workflows/ci.yml`): install → lint → build → test on every PR and on `main`; PRs must be green before merge. README: run scripts + "Dev on phone" (`npm run dev:phone` = `vite --host`, open the Network URL on the iPhone). CLAUDE.md code conventions updated to TS + canvas + pointer events.
- **2026-09-14:** Design session 1. LOCKED §1 (Geometry Dash with a hammer, player is the hammer, instant restart), §2 (two-half swing: finger windup + fixed strike arc, starting numbers, whiff not a fail), §5, §7 principle, §10 NEVER list. Stack ruling: web (Vite+React+canvas), no Mac available; native port kept open via NEVER #8. Reversal recorded: first §1 draft was a soft runner with bent-nail-not-death; Tony redirected to Geometry Dash model. Wrote B01 (swing slice).
