import { describe, expect, it } from 'vitest'
import { config } from './config.ts'
import { level1 } from './level1.ts'
import { createLevelState, nailTime, type GameState } from './state.ts'
import { applyInput, tick, type TickResult } from './update.ts'

const fresh = (t0 = 0) => createLevelState(level1, 1, t0)

/** Wind up and commit so the strike lands exactly `deltaMs` from nail `index` being under the hammer. */
function strikeNail(s: GameState, index: number, deltaMs: number, windupPx = 100): TickResult {
  const target = nailTime(s, s.nails[index]) + deltaMs
  const commitT = target - config.commitToImpactMs
  let st = s
  if (commitT > st.time) st = tick(st, commitT - st.time).state
  st = applyInput(st, { kind: 'windup', heightPx: windupPx, t: commitT })
  st = applyInput(st, { kind: 'commit', t: commitT })
  return tick(st, target + 1 - st.time)
}

describe('strike timing', () => {
  it('impact occurs exactly commitToImpactMs after commit regardless of windup height', () => {
    for (const h of [10, 160, 320]) {
      let s = applyInput(fresh(0), { kind: 'windup', heightPx: h, t: 500 })
      s = applyInput(s, { kind: 'commit', t: 500 })
      expect(s.phase).toBe('strike')
      expect(s.impactT).toBe(500 + config.commitToImpactMs)
      // 16 ms frames: judged at impactT itself, not at the frame that crosses it
      let r = tick(s, 500)
      while (r.state.phase === 'strike') r = tick(r.state, 16)
      expect(r.state.lastImpact?.t).toBe(640)
      expect(r.state.resetStartT).toBe(640)
    }
  })

  it('windup is clamped to the cap and the strike cannot be cancelled', () => {
    let s = applyInput(fresh(0), { kind: 'windup', heightPx: 900, t: 10 })
    expect(s.windupPx).toBe(config.windupCapPx)
    s = applyInput(s, { kind: 'commit', t: 10 })
    expect(applyInput(s, { kind: 'windup', heightPx: 50, t: 20 })).toBe(s)
    expect(applyInput(s, { kind: 'release', t: 20 })).toBe(s)
  })
})

describe('reset window', () => {
  it('windup accepted at 40 ms into reset, rejected at 39 ms', () => {
    const base: GameState = { ...fresh(0), phase: 'reset', resetStartT: 1000, time: 1000 }
    expect(applyInput(base, { kind: 'windup', heightPx: 50, t: 1039 }).phase).toBe('reset')
    expect(applyInput(base, { kind: 'windup', heightPx: 50, t: 1040 }).phase).toBe('windup')
  })

  it('reset returns to neutral after resetMs', () => {
    const r = strikeNail(fresh(0), 0, 0)
    expect(r.state.phase).toBe('reset')
    expect(tick(r.state, config.resetMs).state.phase).toBe('neutral')
  })
})

describe('§2.3 outcomes on level 1 nail n001', () => {
  it('delta 0 and ±20 → flush', () => {
    for (const d of [0, 20, -20]) {
      const r = strikeNail(fresh(0), 0, d)
      expect(r.state.nails[0].status).toBe('flush')
      expect(r.events).toEqual([{ kind: 'impact', outcome: 'flush', deltaMs: d, nailId: 'n001' }])
    }
  })
  it('delta ±21 and ±55 → hit', () => {
    for (const d of [21, 55, -21, -55]) expect(strikeNail(fresh(0), 0, d).state.nails[0].status).toBe('hit')
  })
  it('delta 56 with the head under the hammer → bent → fail → restart in the same tick', () => {
    const r = strikeNail(fresh(0), 0, 56)
    expect(r.events.map((e) => e.kind)).toEqual(['impact', 'fail', 'restart'])
    expect(r.events[1]).toEqual({ kind: 'fail', reason: 'bent', nailId: 'n001' })
    expect(r.state.attempt).toBe(2)
    expect(r.state.nails.every((n) => n.status === 'proud')).toBe(true)
    // the debug overlay still has the delta that bent it
    expect(r.state.lastImpact).toMatchObject({ outcome: 'bent', deltaMs: 56, nailId: 'n001' })
  })
  it('no nail under the hammer → whiff, not a fail', () => {
    const r = strikeNail(fresh(0), 0, -1000)
    expect(r.events).toEqual([{ kind: 'impact', outcome: 'whiff', deltaMs: -1000, nailId: 'n001' }])
    expect(r.state.attempt).toBe(1)
    expect(r.state.nails[0].status).toBe('proud')
    expect(r.state.phase).toBe('reset')
  })
})

describe('missed nail', () => {
  it('a nail passing un-hit raises missed, restarts with attempt+1 and every nail proud', () => {
    const s = fresh(0)
    const windowCloses = nailTime(s, s.nails[0]) + config.hitWindowMs
    const before = tick(s, windowCloses)
    expect(before.events).toEqual([])
    const r = tick(before.state, 1)
    expect(r.events).toEqual([
      { kind: 'fail', reason: 'missed', nailId: 'n001' },
      { kind: 'restart', attempt: 2 },
    ])
    expect(r.state.attempt).toBe(2)
    expect(r.state.nails.every((n) => n.status === 'proud')).toBe(true)
    expect(r.state.scrollX).toBe(0)
  })

  it('restart completes inside one tick, well inside restartMaxMs', () => {
    const s = fresh(0)
    const failAt = nailTime(s, s.nails[0]) + config.hitWindowMs + 1
    const r = tick(s, failAt)
    expect(r.state.attempt).toBe(2)
    expect(r.state.t0).toBe(r.state.time) // new attempt starts on the same clock, same tick
    expect(r.state.time - failAt).toBe(0)
  })
})

describe('win', () => {
  it('sinking every nail wins the level', () => {
    let st = fresh(0)
    let last: TickResult = { state: st, events: [] }
    for (let i = 0; i < st.nails.length; i++) {
      last = strikeNail(last.state, i, i % 2 === 0 ? 0 : 30)
      st = last.state
      expect(st.attempt).toBe(1)
    }
    expect(st.won).toBe(true)
    expect(last.events.map((e) => e.kind)).toContain('win')
    expect(tick(st, 5000).events).toEqual([])
    expect(applyInput(st, { kind: 'windup', heightPx: 50, t: st.time }).phase).toBe('neutral')
  })
})
