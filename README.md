# mygurm · photobooth for two

A photobooth for long-distance couples. Open a room, send the 5-character code,
and take a synced four-cut strip together over live video — no matter how
many miles or timezones are between **you** (pink) and **me** (blue).

Built with **Next.js 14** (App Router, TypeScript, Tailwind) for the site + app,
and **PartyKit** for realtime rooms + WebRTC signaling.

## Features

- **Landing + entry in one.** The homepage is the door: *Create a room* or
  *Join with a code*.
- **Realtime rooms.** Each room is a PartyKit party whose name **is** the
  5-char uppercase code. Collision-safe code generation, presence with two
  roles (`you` / `me`), a `both present` flag, and a hard cap of 2 connections
  (the 3rd is rejected).
- **Peer-to-peer video.** `getUserMedia` + `RTCPeerConnection`, with SDP/ICE
  relayed through the room. STUN + optional TURN via env vars, connection
  quality + reconnecting states, mic/cam toggles, and clean peer-drop handling.
- **Synced photobooth.** The party runs an authoritative 3-2-1 countdown and
  broadcasts a `capture` with a target timestamp so **both** clients grab a
  still at the same instant. Stills are exchanged over the WebRTC data channel
  (falling back to a party relay), composited into a duotone side-by-side pair,
  ×4 into a vertical strip.
- **Keepsakes.** The finished strip is rendered client-side to a
  full-resolution branded PNG (download), with an optional short video clip
  (MediaRecorder) and a *Retake*.

## Project layout

```
app/
  (marketing)/          # landing pages (Nav + Footer chrome)
    page.tsx            #   home = the room entry
    activities/ how-it-works/ faq/
  room/[code]/page.tsx  # the room app (bare chrome)
  opengraph-image.tsx   # dynamic OG image (pink/blue photo strip)
  layout.tsx globals.css
components/              # Button, Pill, Card, Section, Nav, Footer,
                        # RoomEntry, DuoVideo, Photobooth, RoomClient, …
lib/
  room-protocol.ts      # shared, transport-agnostic types (server + client)
  party.ts              # realtime host resolution
  store.ts              # shared (Blob) / on-device (IndexedDB) data layer
  useRoom.ts            # PartySocket wrapper: presence, state, buffered send
  useDuoVideo.ts        # WebRTC: media, RTCPeerConnection, data channel
  usePhotobooth.ts      # capture coordination + strip building
  strip.ts              # canvas strip compositor
worker/                 # the realtime server (Cloudflare Worker / PartyServer)
  server.ts             # RoomServer + LobbyServer Durable Objects + router
  tsconfig.json
wrangler.jsonc          # Worker config (DO bindings, SQLite migrations)
```

## Local development

Run the two dev servers side by side:

```bash
npm install

# terminal 1 — the realtime server (Cloudflare Worker) on http://127.0.0.1:8787
npm run party:dev

# terminal 2 — the Next.js app on http://localhost:3000
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:8787 npm run dev
```

Then open `http://localhost:3000`, click **Create a room**, and open the same
`/room/CODE` in a second browser/profile to be the partner.

> Camera + mic require a **secure context**. `localhost` counts as secure, so
> local dev works; any non-localhost host must be served over HTTPS.

## Environment variables

Copy `.env.example` and fill in what you need.

### Next.js (client + server)

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_PARTYKIT_HOST` | Where the PartyKit server lives. Local: `127.0.0.1:1999` (default). Prod: `<project>.<user>.partykit.dev`. |
| `SITE_PASSWORD` | The shared lock-screen password (defaults to the built-in key). |
| `BLOB_READ_WRITE_TOKEN` | Enables the **shared** "Pictures of us" album + user-added timeline events via Vercel Blob. Auto-set when you enable Blob under Storage in the Vercel dashboard. If unset, those fall back to on-device browser storage. |

### Shared content vs. on-device

- **Pictures of us** (`/gallery`), **photobooth strips** (`/photobooths`), and
  **user-added timeline memories** persist to Vercel Blob when
  `BLOB_READ_WRITE_TOKEN` is set — permanent and shared with everyone who has
  the site password. Without the token they fall back to on-device browser
  storage (earlier on-device strips are still shown alongside shared ones).
- Photos are tagged with the uploader (pink = you, blue = me) and can be tagged
  to a timeline event; a tagged photo then shows on that day's box in
  **Our story** (`/timeline`).
- **Rugs** lives at `public/rugs.mp4` — swap in a new clip to change him.

### Realtime Worker (server-side vars/secrets)

Set these on the Worker (`npx wrangler secret put NAME`) — **not** in Next, so
TURN credentials never ship in the client bundle. The client fetches the ICE
config from the lobby at runtime.

| Var | Purpose |
| --- | --- |
| `TURN_URL` | TURN server URL(s), comma-separated. Optional but strongly recommended for cross-network calls. |
| `TURN_USERNAME` | TURN username. |
| `TURN_CREDENTIAL` | TURN credential. |
| `STUN_URLS` | Optional STUN override (comma-separated). Defaults to Google STUN. |

Any TURN provider works — **Cloudflare TURN**, **Metered**, or **Twilio** all
have free/cheap tiers. Example (Metered-style):

```
TURN_URL=turn:global.turn.example.com:80,turns:global.turn.example.com:443
TURN_USERNAME=xxxx
TURN_CREDENTIAL=yyyy
```

## Deployment

This is a standard Next.js app (**no** `output: 'export'`) plus a separately
deployed realtime server (a Cloudflare Worker running
[PartyServer](https://github.com/cloudflare/partykit), defined in `worker/`).

### 1. Deploy the realtime server (your own Cloudflare account, free)

```bash
# The --config flag is required: it stops Wrangler from auto-detecting the
# Next.js app and trying to convert the whole site to OpenNext. We only want
# to deploy the worker in worker/. (Same as `npm run party:deploy`.)
npx wrangler deploy --config wrangler.jsonc
# first run opens a browser to log in to Cloudflare, then deploys to:
# → https://mygurm-party.<your-subdomain>.workers.dev

# TURN (optional, for cross-network video) — set as secrets:
npx wrangler secret put TURN_URL
npx wrangler secret put TURN_USERNAME
npx wrangler secret put TURN_CREDENTIAL
```

Uses SQLite-backed Durable Objects, so it runs on Cloudflare's free plan.

### 2. Deploy the Next.js app to Vercel

Import the repo into Vercel (framework auto-detected) and set the env var:

```
NEXT_PUBLIC_PARTYKIT_HOST = mygurm-party.<your-subdomain>.workers.dev
```

Deploy. Then click through the golden path in production:

**create → send code → partner joins → both cameras connect → Start →
4-shot strip → download.**

## How it fits together

1. **Create** → the client asks the **lobby** party for a collision-free code,
   then routes to `/room/CODE`.
2. **Connect** → `useRoom` opens a `PartySocket` to the room party. The server
   assigns `you`/`me`, caps at two, and broadcasts room state.
3. **Video** → once both are present, `useDuoVideo` acquires media and opens an
   `RTCPeerConnection`. `me` is the caller, `you` the callee; SDP + ICE are
   relayed through the room. A data channel carries the captured stills.
4. **Capture** → pressing *Start* asks the server to run the authoritative
   countdown. On each `capture{shotIndex, targetTs}`, both clients grab a still
   at the same instant (scheduled against an estimated server-clock offset) and
   exchange it.
5. **Strip** → `usePhotobooth` composites the four pairs and `strip.ts` renders
   the branded full-resolution PNG.

## Testing notes

Verified locally against `partykit dev` + `next dev`:

- **Server logic** (headless WebSocket clients): role assignment, both-present,
  signaling relay, 2-connection cap (3rd rejected), the full 4-shot
  countdown → `strip-ready`, retake → idle, and peer-drop reset.
- **Full browser E2E** (two Chromium contexts with fake media): create → join →
  both present → **bidirectional WebRTC video** → 4-shot strip → 1200×2572 PNG
  on both clients → download enabled → retake.

Real camera testing on mobile Safari / Chrome and desktop still needs an HTTPS
deployment (see above) — `getUserMedia` only runs in a secure context.
