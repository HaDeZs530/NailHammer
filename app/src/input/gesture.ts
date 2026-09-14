import { config } from '../game/config.ts'
import type { GestureEvent } from '../game/update.ts'

/** One pointer event, reduced to what the swing needs. `t` = the event's own timestamp. */
export type PointerSample = { type: 'down' | 'move' | 'up' | 'cancel'; y: number; t: number }

export type GestureTracker = {
  /** Feed one sample; get back zero or more gestures for the core. */
  sample: (s: PointerSample) => GestureEvent[]
  readonly active: boolean
}

/**
 * Turns vertical finger travel into windup / commit / release (§2.1).
 * - Upward travel from the touch-down point raises the hammer 1:1 (DESIGN-OPEN: 1:1 px mapping).
 * - A reversal of ≥ commitThresholdPx below the highest point commits the strike. After commit the
 *   rest of the touch is ignored.
 * - Lifting before commit releases.
 * Pure state machine: no DOM, no clocks.
 */
export function createGestureTracker(): GestureTracker {
  let active = false
  let committed = false
  let anchorY = 0
  let topY = 0
  return {
    get active() {
      return active
    },
    sample(s) {
      switch (s.type) {
        case 'down':
          active = true
          committed = false
          anchorY = s.y
          topY = s.y
          return []
        case 'move': {
          if (!active || committed) return []
          if (s.y < topY) topY = s.y
          const peak = anchorY - topY
          if (peak > 0 && s.y - topY >= config.commitThresholdPx) {
            committed = true
            return [
              { kind: 'windup', heightPx: peak, t: s.t },
              { kind: 'commit', t: s.t },
            ]
          }
          return [{ kind: 'windup', heightPx: Math.max(0, anchorY - s.y), t: s.t }]
        }
        case 'up':
        case 'cancel': {
          const wasCommitted = committed
          active = false
          committed = false
          return wasCommitted ? [] : [{ kind: 'release', t: s.t }]
        }
      }
    },
  }
}
