# Nailhammer — Session Log
Transferable memory so any agent can pick up without re-deriving locks from chat.

**Repo:** `HaDeZs530/Nailhammer` · **Agent split:** Design Chat = design/locks/briefs; Claude Code = code; other tools = art.

## Chronology
- **2026-09-14:** Project created from PROCESS_TEMPLATE.
- **2026-09-14 (Claude Code) DONE — PR #1 Scaffold:** `app/` = Vite 8 + React 19 + TypeScript (strict), StrictMode on, Vitest, ESLint (typescript-eslint + react-hooks + react-refresh). One full-screen portrait `<canvas>` (`GameCanvas.tsx`): DPR-aware sizing, Pointer Events only (pointers tracked by `pointerId`, `touch-action: none`), black screen + FPS counter, no game logic. Tests: `build OK` smoke + FPS meter (4 pass). CI (`.github/workflows/ci.yml`): install → lint → build → test on every PR and on `main`; PRs must be green before merge. README: run scripts + "Dev on phone" (`npm run dev:phone` = `vite --host`, open the Network URL on the iPhone). CLAUDE.md code conventions updated to TS + canvas + pointer events. `{{HARD_RULES}}` in CLAUDE.md still open for the Design Chat (design doc §10 NEVER list).
