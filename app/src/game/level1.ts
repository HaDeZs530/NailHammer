import { config, placeholder } from './config.ts'
import type { Level, Nail } from './state.ts'

/** B01 §4: gap before each nail, in units of nail width. 24 entries = 24 nails. */
export const level1Gaps = [
  1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 0.5, 0.5, 1, 2, 1, 1, 1, 1, 0.5, 0.5, 0.5, 1, 2, 1,
] as const

export function buildLevel1(): Level {
  const w = config.nailWidthPx
  const nails: Nail[] = []
  let x = placeholder.leadInPx
  level1Gaps.forEach((gap, i) => {
    x += gap * w
    nails.push({ id: `n${String(i + 1).padStart(3, '0')}`, centerX: x + w / 2, status: 'proud' })
    x += w
  })
  return {
    id: 'level-1',
    nails,
    lengthPx: x + placeholder.tailPx,
    msPerNailWidth: config.scrollMsPerNailLevel1,
  }
}

export const level1: Level = buildLevel1()
