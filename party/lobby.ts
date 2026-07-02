import type * as Party from "partykit/server";
import {
  DEFAULT_STUN_URLS,
  randomCode,
  type IceConfigResponse,
  type IceServerConfig,
} from "../lib/room-protocol";

/** Reservation lifetimes. */
const RESERVE_TTL = 2 * 60 * 1000; // fresh code, not yet connected
const ACTIVE_TTL = 12 * 60 * 60 * 1000; // code with a live room

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

/**
 * Singleton party (id "index") that hands out collision-free room codes and
 * serves the WebRTC ICE configuration. Room servers ping it to claim/release
 * their code so it's never re-issued while a room is live.
 */
export default class Lobby implements Party.Server {
  /** code -> expiry epoch ms */
  private codes = new Map<string, number>();

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const stored =
      (await this.room.storage.get<Record<string, number>>("codes")) ?? {};
    this.codes = new Map(Object.entries(stored));
    this.prune();
  }

  private prune() {
    const now = Date.now();
    for (const [code, exp] of this.codes) {
      if (exp <= now) this.codes.delete(code);
    }
  }

  private async persist() {
    await this.room.storage.put("codes", Object.fromEntries(this.codes));
  }

  private isTaken(code: string): boolean {
    const exp = this.codes.get(code);
    return exp !== undefined && exp > Date.now();
  }

  private async createCode(): Promise<string> {
    this.prune();
    let code = randomCode();
    // 5 chars over a 32-symbol alphabet ≈ 33M combos; collisions are rare,
    // but loop until we find a genuinely free one.
    let attempts = 0;
    while (this.isTaken(code) && attempts < 50) {
      code = randomCode();
      attempts++;
    }
    this.codes.set(code, Date.now() + RESERVE_TTL);
    await this.persist();
    return code;
  }

  private iceServers(): IceServerConfig[] {
    const env = this.room.env as Record<string, string | undefined>;

    const stun = env.STUN_URLS
      ? env.STUN_URLS.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_STUN_URLS;

    const servers: IceServerConfig[] = [{ urls: stun }];

    // TURN is optional but strongly recommended for cross-network calls.
    if (env.TURN_URL) {
      const urls = env.TURN_URL.split(",").map((s) => s.trim()).filter(Boolean);
      servers.push({
        urls,
        username: env.TURN_USERNAME,
        credential: env.TURN_CREDENTIAL,
      });
    }

    return servers;
  }

  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // GET → ICE configuration for the WebRTC peer connection.
    if (req.method === "GET") {
      const body: IceConfigResponse = { iceServers: this.iceServers() };
      return json(body);
    }

    // POST → code lifecycle: { action: "create" | "claim" | "release", code? }
    if (req.method === "POST") {
      let payload: { action?: string; code?: string } = {};
      try {
        payload = (await req.json()) as typeof payload;
      } catch {
        return json({ error: "bad-json" }, 400);
      }

      switch (payload.action) {
        case "create": {
          const code = await this.createCode();
          return json({ code });
        }
        case "claim": {
          if (payload.code) {
            this.codes.set(payload.code, Date.now() + ACTIVE_TTL);
            await this.persist();
          }
          return json({ ok: true });
        }
        case "release": {
          if (payload.code) {
            this.codes.delete(payload.code);
            await this.persist();
          }
          return json({ ok: true });
        }
        default:
          return json({ error: "unknown-action" }, 400);
      }
    }

    return json({ error: "method-not-allowed" }, 405);
  }
}
