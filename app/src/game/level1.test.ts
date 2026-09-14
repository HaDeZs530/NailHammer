import { describe, expect, it } from 'vitest'
import { config, placeholder } from './config.ts'
import { level1, level1Gaps } from './level1.ts'

describe('level 1', () => {
  it('has 24 nails with unique ids n001…n024', () => {
    expect(level1.nails).toHaveLength(24)
    const ids = level1.nails.map((n) => n.id)
    expect(new Set(ids).size).toBe(24)
    expect(ids[0]).toBe('n001')
    expect(ids[23]).toBe('n024')
  })

  it('uses the brief’s spacing pattern, in nail-width gaps', () => {
    expect(level1Gaps).toHaveLength(24)
    const w = config.nailWidthPx
    let prevRight = placeholder.leadInPx
    level1.nails.forEach((n, i) => {
      const left = n.centerX - w / 2
      expect(left - prevRight).toBe(level1Gaps[i] * w)
      prevRight = left + w
    })
    expect(level1.lengthPx).toBe(prevRight + placeholder.tailPx)
  })

  it('nails are in scroll order and every nail starts proud', () => {
    for (let i = 1; i < level1.nails.length; i++) expect(level1.nails[i].centerX).toBeGreaterThan(level1.nails[i - 1].centerX)
    expect(level1.nails.every((n) => n.status === 'proud')).toBe(true)
  })
})
