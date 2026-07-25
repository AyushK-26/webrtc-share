# WebRTC Share — Client

The frontend for WebRTC Share. Built with React and Vite, styled with Tailwind CSS v4.

## Stack

- React 18
- Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Socket.IO client

## Project structure

```
client/
  src/
    components/
      Landing.jsx       — split-screen landing with join card
      AppScreen.jsx     — main app layout with divider
      Topbar.jsx        — logo, connection status, room ID, leave button
      FilePanel.jsx     — file selection, transfer progress, download
      ChatPanel.jsx     — message list and input
    hooks/
      useWebRTC.js      — peer connection, signaling, ICE logic
      useFileTransfer.js — chunking, flow control, pause/resume/cancel
      useChat.js        — chat messages over data channel
    socket.js           — module-level Socket.IO singleton
    constants.js        — SIGNALING_URL, CHUNK_SIZE, BUFFER_THRESHOLD, MAX_FILE_SIZE
    App.jsx             — root component, landing, app screen routing
    main.jsx            — entry point
    index.css           — Tailwind import + @theme tokens
  .env.example          — environment variable template
```

## Key design decisions

### Hooks

- **`useWebRTC`** — owns the `RTCPeerConnection`, handles signaling listeners, ICE candidate queue, and peer connection lifecycle
- **`useFileTransfer`** — owns the data channel (`dcRef`), `onmessage` handler, chunking loop with `bufferedAmount` flow control, and pause/resume/cancel state
- **`useChat`** — owns chat message state, receives `dcRef` from `useFileTransfer` to send messages, registers an `onChatMessage` callback that `useFileTransfer` calls when a chat message arrives
- `AppScreen` is the wiring point — connects all three hooks together

### File transfer

Files are split into 16KB chunks and sent over the WebRTC data channel:

- `bufferedAmount` is checked before each chunk — if above 256KB, sending pauses until `onbufferedamountlow` fires at 128KB
- Pause/resume uses `isPausedRef` (closure-reliable) + `pausedBy` state (UI logic)
- Cancel uses `isCancelledRef` set before `resetTransfer()`, never cleared inside `resetTransfer` — only reset at the start of a new `sendFile` call
- Both peers see progress; only the sender sees cancel controls

### Chat

Chat messages use the same data channel as file transfer:

```js
{ type: "chat", message: "hello", timestamp: 1234567890 }
```

`useFileTransfer` dispatches chat messages via an `onChatMessage` callback to keep `onmessage` ownership in one place.

### TURN credentials

TURN credentials are fetched from the signaling server on each `joinRoom` call — never hardcoded in the client bundle:

```js
const iceServers = await fetchTurnCredentials(); // GET /api/turn-credentials
const pc = createPeerConnection(iceServers);
```

## Tailwind v4 setup

No `tailwind.config.js` needed. The Vite plugin handles everything:

```js
// vite.config.js
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Custom design tokens are defined in `index.css`:

```css
@import "tailwindcss";

@theme {
  --color-brand: #6c63ff;
  --color-brand-hover: #5a52e0;
  --color-surface: #0d0d0f;
  --color-surface-raised: #111114;
  --color-surface-overlay: #17171b;
  --color-surface-subtle: #1a1a1f;
  --color-surface-muted: #1e1e24;
  --color-border: #2a2a2e;
}
```

## Environment variables

Copy `.env.example` to `.env`:

```env
VITE_SERVER_URL=http://localhost:3000
```

- `VITE_SERVER_URL` — URL of the signaling server

## Local development

```bash
npm install
cp .env.example .env
# set VITE_SERVER_URL to your server URL
npm run dev
```

## Deployment on Render

1. Create a new **Static Site** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set:
   - **Root directory**: `client`
   - **Build command**: `npm install; npm run build`
   - **Publish directory**: `dist`
4. Add environment variable:
   - `VITE_SERVER_URL=https://your-server.onrender.com`

> **Note:** `VITE_` prefixed variables are embedded into the bundle at build time. They are not secret — do not put API keys here.
