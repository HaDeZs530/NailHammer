import { describe, expect, it } from 'vitest'
import { createFpsMeter } from './fps.ts'

describe('createFpsMeter', () => {
  it('reports 0 before two frames exist', () => {
    const m = createFpsMeter()
    expect(m.fps).toBe(0)
    expect(m.tick(0)).toBe(0)
  })

  it('reads ~60 for a steady 16.667 ms frame', () => {
    const m = createFpsMeter(500)
    let fps = 0
    for (let i = 0; i <= 60; i++) fps = m.tick(i * (1000 / 60))
    expect(fps).toBeCloseTo(60, 3)
  })

  it('only averages over the window', () => {
    const m = createFpsMeter(100)
    for (let i = 0; i < 10; i++) m.tick(i * 10) // 100 fps for 100 ms
    for (let i = 1; i <= 5; i++) m.tick(90 + i * 50) // then 20 fps
    expect(m.fps).toBeCloseTo(20, 3)
  })
})
