import { describe, expect, it } from 'vitest'
import { createGestureTracker } from './gesture.ts'

describe('gesture tracker', () => {
  it('upward travel winds up 1:1', () => {
    const g = createGestureTracker()
    g.sample({ type: 'down', y: 500, t: 0 })
    expect(g.sample({ type: 'move', y: 400, t: 16 })).toEqual([{ kind: 'windup', heightPx: 100, t: 16 }])
  })

  it('a reversal of 11 px does not commit', () => {
    const g = createGestureTracker()
    g.sample({ type: 'down', y: 500, t: 0 })
    g.sample({ type: 'move', y: 400, t: 16 })
    const out = g.sample({ type: 'move', y: 411, t: 32 })
    expect(out.some((e) => e.kind === 'commit')).toBe(false)
    expect(out).toEqual([{ kind: 'windup', heightPx: 89, t: 32 }])
  })

  it('a reversal of 12 px commits, from the peak, with the event’s timestamp', () => {
    const g = createGestureTracker()
    g.sample({ type: 'down', y: 500, t: 0 })
    g.sample({ type: 'move', y: 400, t: 16 })
    expect(g.sample({ type: 'move', y: 412, t: 32 })).toEqual([
      { kind: 'windup', heightPx: 100, t: 32 },
      { kind: 'commit', t: 32 },
    ])
    // nothing more from this touch
    expect(g.sample({ type: 'move', y: 600, t: 48 })).toEqual([])
    expect(g.sample({ type: 'up', y: 600, t: 64 })).toEqual([])
  })

  it('a partial windup still commits', () => {
    const g = createGestureTracker()
    g.sample({ type: 'down', y: 500, t: 0 })
    g.sample({ type: 'move', y: 495, t: 16 })
    expect(g.sample({ type: 'move', y: 507, t: 32 }).map((e) => e.kind)).toEqual(['windup', 'commit'])
  })

  it('lifting before commit releases; moving down without any upward travel never commits', () => {
    const g = createGestureTracker()
    g.sample({ type: 'down', y: 500, t: 0 })
    expect(g.sample({ type: 'move', y: 560, t: 16 })).toEqual([{ kind: 'windup', heightPx: 0, t: 16 }])
    expect(g.sample({ type: 'up', y: 560, t: 32 })).toEqual([{ kind: 'release', t: 32 }])
  })
})
