import { config, placeholder } from '../game/config.ts'
import type { GameState } from '../game/state.ts'

/** Logical portrait canvas (§1: 390×844 reference). Width is fitted; height follows the device. */
export const LOGICAL_W = 390
// DESIGN-OPEN: hammer centre x, logical px from the left edge.
export const HAMMER_X = 130
/** Tap target (logical px) for the debug overlay toggle = the attempt counter. */
export const ATTEMPT_BOX = { x: 0, y: 0, w: 140, h: 64 } as const

const NAIL_H = 48
const HEAD_H = 14
const SHAFT_W = 10
const HAMMER_HEAD_H = 40
const HANDLE_W = 12
const HANDLE_H = 110
/** Hammer hovers this far above the nail heads at neutral. */
const NEUTRAL_GAP = 28

export type View = { cssW: number; cssH: number; dpr: number }
export type DebugInfo = { fps: number; latencyMs: number | null }

export const viewScale = (cssW: number) => cssW / LOGICAL_W
export const surfaceY = (logicalH: number) => Math.round(logicalH * 0.66)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const easeInQuad = (p: number) => p * p
const easeOutQuad = (p: number) => 1 - (1 - p) * (1 - p)

/** Hammer bottom edge (logical y) for the current phase. */
export function hammerBottomY(s: GameState, surfY: number): number {
  const impactY = surfY - NAIL_H
  const neutralY = impactY - NEUTRAL_GAP
  switch (s.phase) {
    case 'neutral':
      return neutralY
    case 'windup':
      return neutralY - s.windupPx
    case 'strike': {
      // DESIGN-OPEN: ease-in quad from raised to impact over commitToImpactMs.
      const p = clamp01((s.time - (s.commitT ?? s.time)) / config.commitToImpactMs)
      return lerp(neutralY - s.strikeFromPx, impactY, easeInQuad(p))
    }
    case 'reset': {
      const p = clamp01((s.time - (s.resetStartT ?? s.time)) / config.resetMs)
      return lerp(impactY, neutralY, easeOutQuad(p))
    }
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, s: GameState, view: View, debug: DebugInfo | null) {
  const scale = viewScale(view.cssW)
  const H = view.cssH / scale
  const W = LOGICAL_W
  ctx.setTransform(view.dpr * scale, 0, 0, view.dpr * scale, 0, 0)

  // Sky + surface (one line of wood).
  ctx.fillStyle = '#101418'
  ctx.fillRect(0, 0, W, H)
  const surfY = surfaceY(H)
  ctx.fillStyle = '#3a2a1a'
  ctx.fillRect(0, surfY, W, H - surfY)
  ctx.fillStyle = '#7a5230'
  ctx.fillRect(0, surfY, W, 4)

  // Nails, status-coloured rectangles.
  const w = config.nailWidthPx
  for (const n of s.nails) {
    const x = HAMMER_X + n.centerX - s.scrollX
    if (x < -w || x > W + w) continue
    switch (n.status) {
      case 'proud':
        ctx.fillStyle = '#9aa3ad'
        ctx.fillRect(x - SHAFT_W / 2, surfY - NAIL_H, SHAFT_W, NAIL_H)
        ctx.fillRect(x - w / 2, surfY - NAIL_H, w, HEAD_H)
        break
      case 'hit':
        ctx.fillStyle = '#3ddc84'
        ctx.fillRect(x - w / 2, surfY - 8, w, HEAD_H)
        break
      case 'flush':
        ctx.fillStyle = '#ffc93c'
        ctx.fillRect(x - w / 2, surfY - 2, w, HEAD_H)
        break
      case 'bent':
        ctx.save()
        ctx.translate(x, surfY)
        ctx.rotate(0.6)
        ctx.fillStyle = '#ff4d4d'
        ctx.fillRect(-SHAFT_W / 2, -NAIL_H, SHAFT_W, NAIL_H)
        ctx.fillRect(-w / 2, -NAIL_H, w, HEAD_H)
        ctx.restore()
        break
    }
  }

  // Hammer: head + handle, x fixed, y from the phase.
  const bottom = hammerBottomY(s, surfY)
  const hw = placeholder.hammerWidthPx
  ctx.fillStyle = '#c8ccd2'
  ctx.fillRect(HAMMER_X - hw / 2, bottom - HAMMER_HEAD_H, hw, HAMMER_HEAD_H)
  ctx.fillStyle = '#8a5a2b'
  ctx.fillRect(HAMMER_X - HANDLE_W / 2, bottom - HAMMER_HEAD_H - HANDLE_H, HANDLE_W, HANDLE_H)

  // Progress bar across the top (§2.4).
  const progress = clamp01(s.scrollX / s.level.lengthPx)
  ctx.fillStyle = '#2a3038'
  ctx.fillRect(8, 8, W - 16, 8)
  ctx.fillStyle = s.won ? '#3ddc84' : '#e8eef4'
  ctx.fillRect(8, 8, (W - 16) * progress, 8)

  // Attempt counter, top-left (tap = debug overlay).
  ctx.fillStyle = '#e8eef4'
  ctx.font = 'bold 18px ui-monospace, Menlo, monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(`attempt ${s.attempt}`, 12, 26)

  if (s.won) {
    ctx.textAlign = 'center'
    ctx.font = 'bold 28px ui-monospace, Menlo, monospace'
    ctx.fillStyle = '#3ddc84'
    ctx.fillText('LEVEL CLEAR', W / 2, surfY - 200)
    ctx.font = '16px ui-monospace, Menlo, monospace'
    ctx.fillStyle = '#e8eef4'
    ctx.fillText('tap to go again', W / 2, surfY - 160)
    ctx.textAlign = 'start'
  }

  if (debug) {
    const li = s.lastImpact
    const lines = [
      `${debug.fps.toFixed(0)} fps   latency ${debug.latencyMs === null ? '—' : debug.latencyMs.toFixed(1)} ms`,
      li
        ? `last impact: ${li.outcome} ${li.deltaMs === null ? '' : `${li.deltaMs >= 0 ? '+' : ''}${li.deltaMs.toFixed(1)} ms`} ${li.nailId ?? ''}`
        : 'last impact: —',
      `phase ${s.phase}  windup ${s.windupPx.toFixed(0)} px  scroll ${s.scrollX.toFixed(0)} px`,
    ]
    ctx.font = '13px ui-monospace, Menlo, monospace'
    ctx.fillStyle = '#0f0'
    lines.forEach((l, i) => ctx.fillText(l, 12, H - 70 + i * 18))
  }
}
