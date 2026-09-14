import { config, placeholder } from './config.ts'
import { judge } from './judge.ts'
import {
  createLevelState,
  nailTime,
  scrollPxPerMs,
  type GameState,
  type Nail,
  type NailStatus,
  type Outcome,
} from './state.ts'

/** What the input layer hands the core. `t` is the pointer event's own timestamp, never the handler's. */
export type GestureEvent =
  | { kind: 'windup'; heightPx: number; t: number }
  | { kind: 'commit'; t: number }
  | { kind: 'release'; t: number }

export type GameEvent =
  | { kind: 'impact'; outcome: Outcome; deltaMs: number | null; nailId: string | null }
  | { kind: 'fail'; reason: 'bent' | 'missed'; nailId: string }
  | { kind: 'restart'; attempt: number }
  | { kind: 'win' }

export type TickResult = { state: GameState; events: GameEvent[] }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function windupAccepted(s: GameState, t: number): boolean {
  if (s.won) return false
  switch (s.phase) {
    case 'neutral':
    case 'windup':
      return true
    case 'reset':
      return t - (s.resetStartT ?? -Infinity) >= config.resetAcceptWindupMs
    case 'strike':
      return false // §2.1: the strike cannot be cancelled
  }
}

/** Pure. Applies one gesture at time `t` (defaults to the gesture's own timestamp). */
export function applyInput(state: GameState, g: GestureEvent, t: number = g.t): GameState {
  switch (g.kind) {
    case 'windup':
      if (!windupAccepted(state, t)) return state
      return { ...state, phase: 'windup', windupPx: clamp(g.heightPx, 0, config.windupCapPx), resetStartT: null }
    case 'commit':
      if (state.phase !== 'windup') return state
      return {
        ...state,
        phase: 'strike',
        commitT: t,
        impactT: t + config.commitToImpactMs,
        strikeFromPx: state.windupPx,
        windupPx: 0,
      }
    case 'release':
      // DESIGN-OPEN: lifting the finger before commit drops the hammer back to neutral, no strike.
      if (state.phase !== 'windup') return state
      return { ...state, phase: 'neutral', windupPx: 0 }
  }
}

function nearestProud(s: GameState, atT: number): { nail: Nail | null; deltaMs: number | null } {
  let best: Nail | null = null
  let bestDelta = Infinity
  for (const n of s.nails) {
    if (n.status !== 'proud') continue
    const d = atT - nailTime(s, n)
    if (Math.abs(d) < Math.abs(bestDelta)) {
      best = n
      bestDelta = d
    }
  }
  return best ? { nail: best, deltaMs: bestDelta } : { nail: null, deltaMs: null }
}

function restart(s: GameState, events: GameEvent[], reason: 'bent' | 'missed', nailId: string): TickResult {
  events.push({ kind: 'fail', reason, nailId })
  // Same tick, same clock: 0 ms from fail to the new attempt (§2.2 allows ≤ 500 ms). No async.
  // lastImpact survives the restart so the debug overlay still shows the delta that bent the nail.
  const next = { ...createLevelState(s.level, s.attempt + 1, s.time), lastImpact: s.lastImpact }
  events.push({ kind: 'restart', attempt: next.attempt })
  return { state: next, events }
}

/** Pure. Advances the level clock by `dt` ms and resolves everything that happened in between. */
export function tick(state: GameState, dt: number): TickResult {
  const events: GameEvent[] = []
  let s: GameState = { ...state, time: state.time + dt }
  if (s.won) return { state: s, events }

  // 1. The strike lands. Judged at impactT itself, not at the frame that crosses it, so frame
  //    rate never moves the window.
  if (s.phase === 'strike' && s.impactT !== null && s.impactT <= s.time) {
    const impactT = s.impactT
    const { nail, deltaMs } = nearestProud(s, impactT)
    const overlapPx = (config.nailWidthPx + placeholder.hammerWidthPx) / 2
    const overlaps = deltaMs !== null && Math.abs(deltaMs) * scrollPxPerMs(s.level) < overlapPx
    const outcome = judge(deltaMs ?? Infinity, overlaps)
    const sunk: NailStatus | null = outcome === 'whiff' ? null : outcome
    const nails = nail && sunk ? s.nails.map((n) => (n.id === nail.id ? { ...n, status: sunk } : n)) : s.nails
    s = {
      ...s,
      nails,
      phase: 'reset',
      resetStartT: impactT,
      windupPx: 0,
      strikeFromPx: 0,
      commitT: null,
      impactT: null,
      lastImpact: { t: impactT, outcome, deltaMs, nailId: nail?.id ?? null },
    }
    events.push({ kind: 'impact', outcome, deltaMs, nailId: nail?.id ?? null })
    if (outcome === 'bent' && nail) return restart(s, events, 'bent', nail.id)
  }

  // 2. Reset finishes.
  if (s.phase === 'reset' && s.resetStartT !== null && s.time >= s.resetStartT + config.resetMs) {
    s = { ...s, phase: 'neutral', resetStartT: null }
  }

  // 3. Scroll is a function of time.
  s = { ...s, scrollX: (s.time - s.t0) * scrollPxPerMs(s.level) }

  // 4. A proud nail whose hit window has closed = missed nail → fail.
  for (const n of s.nails) {
    if (n.status === 'proud' && s.time > nailTime(s, n) + config.hitWindowMs) {
      return restart(s, events, 'missed', n.id)
    }
  }

  // 5. Every nail sunk = level won.
  if (s.nails.every((n) => n.status === 'hit' || n.status === 'flush')) {
    s = { ...s, won: true, phase: 'neutral', windupPx: 0 }
    events.push({ kind: 'win' })
  }

  return { state: s, events }
}
