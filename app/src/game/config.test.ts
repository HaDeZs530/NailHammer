import { describe, expect, it } from 'vitest'
import { config, scrollPxPerSecLevel1 } from './config.ts'

// §2.2 — one assertion per number. If a number changes in the design doc it changes here first.
describe('§2.2 starting numbers', () => {
  it('commit threshold = 12 px', () => expect(config.commitThresholdPx).toBe(12))
  it('commit → impact = 140 ms', () => expect(config.commitToImpactMs).toBe(140))
  it('hit window = ±55 ms', () => expect(config.hitWindowMs).toBe(55))
  it('flush window = ±20 ms', () => expect(config.flushWindowMs).toBe(20))
  it('reset to neutral = 120 ms', () => expect(config.resetMs).toBe(120))
  it('next windup accepted from 40 ms into reset', () => expect(config.resetAcceptWindupMs).toBe(40))
  it('windup cap = 320 px', () => expect(config.windupCapPx).toBe(320))
  it('nail width = 64 px', () => expect(config.nailWidthPx).toBe(64))
  it('level 1 scroll = one nail width per 400 ms', () => expect(config.scrollMsPerNailLevel1).toBe(400))
  it('level 1 scroll = 160 px/s', () => expect(scrollPxPerSecLevel1).toBe(160))
  it('restart after fail ≤ 500 ms', () => expect(config.restartMaxMs).toBe(500))
})
