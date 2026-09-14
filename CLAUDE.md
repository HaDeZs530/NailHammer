# CLAUDE.md — Nailhammer Project Instructions

## What this project is
Nailhammer: a side-scrolling iOS game where you hit nails with a hammer.

## Agent split
- **Claude Design Chat** (claude.ai Project "Nailhammer — Design") = design authority: locks, design-doc edits, briefs in `docs/CLAUDE_BRIEFS/`, session log, audits of code vs locks.
- **Claude Code** (this agent) = **all coding**, plus committing doc files handed over from the Design Chat.
- Other tools = art / ad-hoc. They do not lock design.
- Workflow: `docs/AGENT_COORDINATION.md`. **Home sessions: start at `docs/CLAUDE_HOME_HANDOFF.md`.**

## Source of truth — read before building
1. `docs/Nailhammer_Design_Doc.md` — LOCKED sections are decided; never contradict, flag conflicts.
2. `docs/*_Lock.md` — newer wins over the design doc where they conflict.
3. `docs/SESSION_LOG.md` — chronology.
4. `docs/CLAUDE_HOME_HANDOFF.md` — current queue. `docs/CLAUDE_BRIEFS/` — active tasks.
Design gaps: placeholder + `// DESIGN-OPEN:` only. Never invent mechanics, rates, or names.

## Hard rules
1. One finger only; no buttons during play.
2. The strike arc is fixed — same every time. Never variable.
3. Whiffs never fail the player; only missed/bent nails do.
4. Restart ≤ 500 ms.
5. No text jokes on screen — comedy is motion and sound.
6. No pay-to-win, energy, lives, or in-level ads.
7. Never invent a mechanic — `// DESIGN-OPEN` placeholder, flag in PR.
8. Game logic stays pure and framework-free (state + updaters); render/input are thin layers, so a native port stays possible.
9. Every number ships with a unit test asserting it.

## Code conventions
- App in `app/` (Vite + React 19 + TypeScript, StrictMode on; Capacitor iOS wrap later). Keep `npm run dev` / `npm run build` / `npm test` / `npm run lint` runnable — CI runs all four on every PR and PRs must be green before merge.
- One full-screen `<canvas>` (`app/src/GameCanvas.tsx`) is the whole game surface. Input is Pointer Events only (no separate mouse/touch handlers); track pointers by `pointerId`.
- Game core is pure TS in `app/src/game/` (no React, no canvas, no `Date.now()` — time is passed in); `app/src/input/` and `app/src/render/` are thin layers (NEVER #8).
- Mobile-portrait-first (390×844). No new deps without a reason.
- Tests: Vitest, `*.test.ts(x)` next to the code. Every brief that sets a number or rule ships with a test asserting it.
- Phone playtest: `npm run dev:phone` and open the Network URL on the iPhone (README → "Dev on phone").

## "go" / "next" — Tony's standing command
When Tony says **go**, **next**, or **continue**: `git pull` → read `docs/CLAUDE_HOME_HANDOFF.md` → take the top active brief → implement on a branch → build/tests → PR → merge it yourself → mark DONE in the handoff, briefs README and `docs/SESSION_LOG.md` → report PR number and any `DESIGN-OPEN`. Then stop unless told **next** again.

## Workflow
- Brief → feature branch → PR (summary + phone test notes) → build green → **merge it yourself** (`gh pr merge --squash`) → append DONE line to `docs/SESSION_LOG.md`.
- Always `git pull` first. Never force-push over others.
