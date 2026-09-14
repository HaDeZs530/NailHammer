import { useEffect, useRef, type PointerEvent } from 'react'
import { createFpsMeter } from './game/fps.ts'

/**
 * The one full-screen canvas the whole game renders into. Portrait phone first.
 *
 * - Sized to the viewport (CSS px) with a device-pixel-ratio backing store, re-measured on resize
 *   and orientation change.
 * - All input arrives as Pointer Events (mouse, touch and pen through one path); `touch-action: none`
 *   on the canvas keeps the browser from scrolling or zooming. Active pointers are tracked by
 *   `pointerId` so a second finger never disturbs the first.
 * - No game logic yet: black screen + FPS counter.
 */
type ActivePointer = { id: number; x: number; y: number; type: string }

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointersRef = useRef<Map<number, ActivePointer>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 3)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)

    const meter = createFpsMeter()
    let raf = 0
    const frame = (now: number) => {
      const fps = meter.tick(now)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#0f0'
      ctx.font = '14px ui-monospace, Menlo, monospace'
      ctx.textBaseline = 'top'
      // Below the notch / status bar on iPhone.
      ctx.fillText(`${fps.toFixed(0)} fps`, 12, 52)
      ctx.fillText(`${width}x${height} @${dpr.toFixed(2)}x  pointers:${pointersRef.current.size}`, 12, 70)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
    }
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { id: e.pointerId, x: e.clientX, y: e.clientY, type: e.pointerType })
  }
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const p = pointersRef.current.get(e.pointerId)
    if (!p) return
    p.x = e.clientX
    p.y = e.clientY
  }
  const onPointerEnd = (e: PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId)
  }

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}
