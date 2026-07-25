# WebRTC Share — Server

The signaling server for WebRTC Share. Handles room management and relays SDP offer/answer and ICE candidates between peers during connection setup. Also serves TURN credentials from Metered.ca.

## Responsibilities

- **Room management** — enforces a 2-peer cap per room, assigns host/guest roles
- **Signaling relay** — forwards offer, answer, and ICE candidates between peers
- **TURN credentials** — fetches ICE server config from Metered.ca and returns it to the client, keeping the API key server-side

Once two peers connect via WebRTC, the server is no longer involved in their communication.

## Stack

- Node.js 22+
- Express
- Socket.IO v4

## Project structure

```
server/
  constants.js          — PORT, CORS_CONFIG, METERED_BASE_URL
  socket/
    roomHandler.js      — join-room, leave-room, disconnect
    relayHandler.js     — offer, answer, ice-candidate relay
    index.js            — wires handlers together
  index.js              — server entry point
  .env.example          — environment variable template
```

## Socket events

### Client → Server

| Event           | Payload         | Description                    |
| --------------- | --------------- | ------------------------------ |
| `join-room`     | `roomId`        | Join a room as host or guest   |
| `leave-room`    | —               | Intentionally leave the room   |
| `offer`         | `{ offer }`     | SDP offer from host            |
| `answer`        | `{ answer }`    | SDP answer from guest          |
| `ice-candidate` | `{ candidate }` | ICE candidate from either peer |

### Server → Client

| Event           | Payload                   | Description                                 |
| --------------- | ------------------------- | ------------------------------------------- |
| `peer-joined`   | —                         | Emitted to host when guest joins            |
| `peer-left`     | —                         | Emitted to the remaining peer on disconnect |
| `offer`         | `{ offer, senderId }`     | Relayed SDP offer                           |
| `answer`        | `{ answer, senderId }`    | Relayed SDP answer                          |
| `ice-candidate` | `{ candidate, senderId }` | Relayed ICE candidate                       |

## REST endpoints

### `GET /api/turn-credentials`

Fetches ICE server config from Metered.ca and returns it to the client.

**Response:**

```json
[
  { "urls": "stun:stun.relay.metered.ca:80" },
  {
    "urls": "turn:global.relay.metered.ca:80",
    "username": "...",
    "credential": "..."
  }
]
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=3000
METERED_API_KEY=your_metered_api_key
```

- `METERED_API_KEY` — from your Metered.ca dashboard, used to fetch ICE servers

## Local development

```bash
npm install
cp .env.example .env
# fill in .env
npm run dev
```

## Deployment on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `node index.js`
4. Add environment variables in the Render dashboard:
   - `METERED_API_KEY`
5. Update `CORS_CONFIG` in `constants.js` to allow your client's Render URL:
   ```js
   export const CORS_CONFIG = {
     origin: ["https://your-client.onrender.com"],
   };
   ```

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to respond.
