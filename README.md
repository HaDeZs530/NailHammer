# Nailhammer

A side-scrolling iOS game where you hit nails with a hammer. Vite + React 19 + TypeScript now; iOS wrap later.

**Agents: read [`CLAUDE.md`](CLAUDE.md) first.** Design source of truth and project state live in [`docs/`](docs/). Process is copied from the Eldrathor `PROCESS_TEMPLATE`.

## Run it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server, localhost only |
| `npm run dev:phone` | Vite dev server on the LAN (`vite --host`) — see below |
| `npm run build` | Type-check (`tsc -b`) + production build to `app/dist/` |
| `npm run lint` | ESLint (TypeScript + React hooks + React refresh rules) |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |

CI (`.github/workflows/ci.yml`) runs install → lint → build → test on every PR and on pushes to `main`. PRs must be green before merge.

## Dev on phone

The game is portrait-phone-first, so playtest it on the iPhone against the dev server running on the PC. Both devices must be on the same Wi-Fi.

1. Start the dev server bound to all interfaces:
   ```bash
   cd app
   npm run dev:phone
   ```
   (that is `vite --host`). Vite prints two URLs:
   ```
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.x.x:5173/
   ```
2. On the iPhone, open Safari and type the **Network** URL exactly as printed (the `192.168.x.x:5173` one).
3. For a full-screen, notch-aware view: Share → **Add to Home Screen**, then launch it from the icon. It opens without Safari's chrome (`apple-mobile-web-app-capable` is set in `index.html`).
4. Edits on the PC hot-reload on the phone.

If the phone can't reach it:
- Find the PC's LAN IP with `ipconfig` (Windows, look for the Wi-Fi adapter's IPv4 address) or `ifconfig` / `ipconfig getifaddr en0` (Mac).
- Windows Firewall may block Node on private networks the first time. Allow **Node.js** for Private networks when prompted, or add an inbound rule for TCP 5173.
- Guest / isolated Wi-Fi networks block device-to-device traffic. Use the main home network or the phone's hotspot (then the PC joins the hotspot and the Network URL changes).
- Vite picks the next free port if 5173 is taken. Use whatever port it prints.

No HTTPS is needed for the canvas or pointer events. If a later feature needs a secure context (camera, motion sensors, clipboard), add `@vitejs/plugin-basic-ssl` at that point.
