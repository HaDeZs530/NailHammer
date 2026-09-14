import { config } from './config.ts'

export type NailStatus = 'proud' | 'hit' | 'flush' | 'bent'

/** Permanent id from day one; `centerX` is in level px, measured from the hammer at t0. */
export type Nail = { readonly id: string; readonly centerX: number; readonly status: NailStatus }

export type Level = {
  readonly id: string
  readonly nails: readonly Nail[]
  /** Level length in px (progress bar = scrollX / lengthPx). */
  readonly lengthPx: number
  /** Scroll speed: ms for one nail width to pass the hammer. */
  readonly msPerNailWidth: number
}

export type HammerPhase = 'neutral' | 'windup' | 'strike' | 'reset'
export type Outcome = 'flush' | 'hit' | 'bent' | 'whiff'

export type Impact = {
  /** Level-clock time the strike landed (= commitT + commitToImpactMs). */
  readonly t: number
  readonly outcome: Outcome
  /** impact time − nail-under-hammer time, ms. Positive = late. null when no proud nail was left. */
  readonly deltaMs: number | null
  readonly nailId: string | null
}

export type GameState = {
  readonly level: Level
  readonly attempt: number
  /** Level clock start (ms). Scroll is a pure function of `time - t0`. */
  readonly t0: number
  readonly time: number
  readonly scrollX: number
  readonly nails: readonly Nail[]
  readonly phase: HammerPhase
  /** Hammer raised height above neutral, px, while winding up. */
  readonly windupPx: number
  /** Height the current strike started from (render only). */
  readonly strikeFromPx: number
  readonly commitT: number | null
  readonly impactT: number | null
  readonly resetStartT: number | null
  readonly lastImpact: Impact | null
  readonly won: boolean
}

export function createLevelState(level: Level, attempt: number, t0: number): GameState {
  return {
    level,
    attempt,
    t0,
    time: t0,
    scrollX: 0,
    nails: level.nails.map((n) => ({ ...n, status: 'proud' })),
    phase: 'neutral',
    windupPx: 0,
    strikeFromPx: 0,
    commitT: null,
    impactT: null,
    resetStartT: null,
    lastImpact: null,
    won: false,
  }
}

/** px of scroll per ms for this level. */
export function scrollPxPerMs(level: Level): number {
  return config.nailWidthPx / level.msPerNailWidth
}

/** Level-clock time (ms) at which the nail's centre is exactly under the hammer. */
export function nailTime(state: GameState, nail: Nail): number {
  return state.t0 + (nail.centerX * state.level.msPerNailWidth) / config.nailWidthPx
}
