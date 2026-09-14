import { describe, expect, it } from 'vitest'
import { judge } from './judge.ts'

// §2.3 outcomes, at the exact edges the brief names.
describe('judge', () => {
  it('delta 0 → flush', () => expect(judge(0, true)).toBe('flush'))
  it('delta 20 → flush', () => expect(judge(20, true)).toBe('flush'))
  it('delta 21 → hit', () => expect(judge(21, true)).toBe('hit'))
  it('delta 55 → hit', () => expect(judge(55, true)).toBe('hit'))
  it('delta 56 with overlap → bent', () => expect(judge(56, true)).toBe('bent'))
  it('delta 56 with no overlap → whiff', () => expect(judge(56, false)).toBe('whiff'))
  it('early strikes judge the same as late (sign ignored)', () => {
    expect(judge(-20, true)).toBe('flush')
    expect(judge(-55, true)).toBe('hit')
    expect(judge(-56, true)).toBe('bent')
  })
  it('no proud nail left → whiff', () => expect(judge(Infinity, false)).toBe('whiff'))
})
