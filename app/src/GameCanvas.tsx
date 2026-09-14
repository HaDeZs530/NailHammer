import { useEffect, useRef } from 'react'
import { createAudio } from './audio/beeps.ts'
import { createFpsMeter } from './game/fps.ts'
import { level1 } from './game/level1.ts'
import { createLevelState, type GameState } from './game/state.ts'
import { applyInput, tick } from './game/update.ts'
import { createGestureTracker, type PointerSample } from './input/gesture.ts'
import { ATTEMPT_BOX, drawFrame, viewScale, type View } from './render/draw.ts'

/**
 * The one full-screen canvas the whole game renders into. Portrait phone first.
 *
 * Thin layer (NEVER #8): owns the canvas, the rAF loop and the pointer listeners. Everything that
 * decides anything lives in `game/` (pure), `input/` (gesture state machine) and `render/` (drawing).
 *
 * - Pointer Events only. One finger (NEVER #1): the first pointer down is the finger; others are ignored.
 * - Samples carry the event's own timestamp and are applied at the next frame; the strike is timed
 *   from the event, so frame timing never moves it. Latency = frame time − event time (debug overlay).
 */

/** Pointer timestamps share rAF's clock on every current browser; fall back if one is epoch-based. */
function eventTime(e: Event): number {
  const now = performance.now()
  return Math.abs(e.timeStamp - now) > 60_000 ? now : e.timeStamp
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const view: View = { cssW: 0, cssH: 0, dpr: 1 }
    const resize = () => {
      view.dpr = Math.min(window.devicePixelRatio || 1, 3)
      view.cssW = canvas.clientWidth
      view.cssH = canvas.clientHeight
      canvas.width = Math.round(view.cssW * view.dpr)
      canvas.height = Math.round(view.cssH * view.dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)

    const tracker = createGestureTracker()
    const audio = createAudio()
    const meter = createFpsMeter()
    const pending: PointerSample[] = []
    const latency: number[] = []
    let state: GameState | null = null
    let activePointer: number | null = null
    let debug = false
    let wantRestart = false
    let lastNow = 0

    const onDown = (e: PointerEvent) => {
      audio.unlock()
      if (activePointer !== null) return
      const scale = viewScale(view.cssW)
      const lx = e.offsetX / scale
      const ly = e.offsetY / scale
      if (lx >= ATTEMPT_BOX.x && lx <= ATTEMPT_BOX.x + ATTEMPT_BOX.w && ly >= ATTEMPT_BOX.y && ly <= ATTEMPT_BOX.y + ATTEMPT_BOX.h) {
        debug = !debug
        return
      }
      if (state?.won) {
        wantRestart = true
        return
      }
      activePointer = e.pointerId
      pending.push({ type: 'down', y: e.clientY, t: eventTime(e) })
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        // Capture is a nicety (keeps moves coming if the finger leaves the canvas); never lose the touch over it.
      }
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return
      pending.push({ type: 'move', y: e.clientY, t: eventTime(e) })
    }
    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return
      activePointer = null
      pending.push({ type: e.type === 'pointercancel' ? 'cancel' : 'up', y: e.clientY, t: eventTime(e) })
    }
    const onContextMenu = (e: Event) => e.preventDefault()
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onEnd)
    canvas.addEventListener('pointercancel', onEnd)
    canvas.addEventListener('contextmenu', onContextMenu)

    let raf = 0
    const frame = (now: number) => {
      const fps = meter.tick(now)
      if (!state) {
        state = createLevelState(level1, 1, now)
        lastNow = now
      }
      if (wantRestart) {
        // DESIGN-OPEN: after a clear, "tap to go again" continues the attempt counter.
        wantRestart = false
        state = createLevelState(level1, state.attempt + 1, now)
        lastNow = now
      }

      // Latency = when this frame consumes the event − the event's own timestamp. rAF's `now` is the
      // frame's start and can precede events delivered in the same frame, so read the clock here.
      const consumedAt = performance.now()
      for (const s of pending) {
        latency.push(consumedAt - s.t)
        if (latency.length > 30) latency.shift()
        for (const g of tracker.sample(s)) state = applyInput(state, g, g.t)
      }
      pending.length = 0

      const r = tick(state, now - lastNow)
      lastNow = now
      state = r.state
      for (const ev of r.events) {
        if (ev.kind === 'impact' && ev.outcome !== 'bent') audio.play(ev.outcome)
        else if (ev.kind === 'fail') audio.play('fail')
      }

      const latencyMs = latency.length ? latency.reduce((a, b) => a + b, 0) / latency.length : null
      drawFrame(ctx, state, view, debug ? { fps, latencyMs } : null)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onEnd)
      canvas.removeEventListener('pointercancel', onEnd)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  return <canvas ref={canvasRef} className="game-canvas" />
}
