import { config } from './config.ts'
import type { Outcome } from './state.ts'

/**
 * §2.3 outcome of a strike.
 * @param deltaMs impact time − nail-under-hammer time for the nearest proud nail (sign irrelevant).
 *   Pass Infinity when no proud nail is left.
 * @param overlaps whether that nail's head is under the hammer at impact.
 */
export function judge(deltaMs: number, overlaps: boolean): Outcome {
  const d = Math.abs(deltaMs)
  if (d <= config.flushWindowMs) return 'flush'
  if (d <= config.hitWindowMs) return 'hit'
  return overlaps ? 'bent' : 'whiff'
}
