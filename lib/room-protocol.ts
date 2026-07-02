/**
 * Shared, transport-agnostic protocol between the PartyKit server (`party/`)
 * and the browser client (`lib/`, `components/`).
 *
 * IMPORTANT: keep this file free of any runtime imports and DOM/Worker-only
 * types so it typechecks in both environments. WebRTC payloads are described
 * structurally (not with `RTC*` DOM lib types) so the server can relay them
 * opaquely.
 */

export type Role = "you" | "me";

/** The photobooth state machine. */
export type RoomPhase = "idle" | "countdown" | "capturing" | "strip-ready";

/** Number of shots in a finished strip. */
export const SHOTS = 4;

/** Room-code alphabet — unambiguous uppercase letters + digits (no O/0/I/1). */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 5;

export function isValidCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  for (const ch of code) {
    if (!CODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}

/** Normalize user input into a candidate code (uppercase, filtered). */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((ch) => CODE_ALPHABET.includes(ch))
    .join("")
    .slice(0, CODE_LENGTH);
}

/** Generate one random candidate code. Collision-checking lives in the lobby. */
export function randomCode(
  rand: () => number = Math.random
): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Snapshot of a room broadcast to every connected client. */
export type RoomState = {
  code: string;
  phase: RoomPhase;
  /** Roles currently connected, e.g. ["you"] or ["you","me"]. */
  roles: Role[];
  bothPresent: boolean;
  /** Current shot being captured (0-based); -1 when idle. */
  shotIndex: number;
  totalShots: number;
  /** Countdown tick (3 → 2 → 1) while phase === "countdown". */
  countdownValue: number | null;
};

export function emptyState(code: string): RoomState {
  return {
    code,
    phase: "idle",
    roles: [],
    bothPresent: false,
    shotIndex: -1,
    totalShots: SHOTS,
    countdownValue: null,
  };
}

// ----- WebRTC signaling payloads (structural, DOM-free) -----

export type SdpDescription = {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
};

export type IceCandidate = {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
} | null;

export type SignalData =
  | { kind: "description"; description: SdpDescription }
  | { kind: "candidate"; candidate: IceCandidate }
  | { kind: "bye" };

// ----- Server → Client -----

export type RoomErrorCode = "room-full" | "bad-message";

export type ServerMessage =
  | { t: "welcome"; role: Role; self: string; state: RoomState; ts: number }
  | { t: "state"; state: RoomState; ts: number }
  | { t: "signal"; from: Role; data: SignalData; ts: number }
  | { t: "capture"; shotIndex: number; targetTs: number; ts: number }
  | { t: "photo"; from: Role; shotIndex: number; dataUrl: string; ts: number }
  | { t: "error"; code: RoomErrorCode; message: string; ts: number };

// ----- Client → Server -----

export type ClientMessage =
  | { t: "start" }
  | { t: "retake" }
  | { t: "signal"; data: SignalData }
  | { t: "photo"; shotIndex: number; dataUrl: string };

// ----- ICE config (served by the lobby, consumed by the client) -----

export type IceServerConfig = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type IceConfigResponse = {
  iceServers: IceServerConfig[];
};

export const DEFAULT_STUN_URLS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
];

/** Timing constants shared by server + client for the capture flow. */
export const TIMING = {
  /** Ticks of the 3-2-1 countdown, in ms. */
  countdownStep: 1000,
  /** Lead time added to `targetTs` so both clients can schedule the grab. */
  captureLeadMs: 600,
  /** Delay between finishing one shot and starting the next countdown. */
  betweenShotsMs: 1600,
} as const;
