import { expect, it } from 'vitest'
import App from './App.tsx'
import GameCanvas from './GameCanvas.tsx'

// "build OK": the app entry modules compile, import and export components.
it('build OK: App and GameCanvas are components', () => {
  expect(typeof App).toBe('function')
  expect(typeof GameCanvas).toBe('function')
})
