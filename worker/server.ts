import {
  Server,
  getServerByName,
  routePartykitRequest,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from "partyserver";
import {
  DEFAULT_STUN_URLS,
  randomCode,
  SHOTS,
  TIMING,
  type ClientMessage,
  type IceConfigResponse,
  type IceServerConfig,
  type Role,
  type RoomPhase,
  type RoomState,
  type ServerMessage,
} from "../lib/room-protocol";

export interface Env {
  Main: DurableObjectNamespace<RoomServer>;
  Lobby: DurableObjectNamespace<LobbyServer>;
  TURN_URL?: string;
  TURN_USERNAME?: string;
  TURN_CREDENTIAL?: string;
  STUN_URLS?: string;
}

const ROLES: Role[] = ["you", "me"];
type ConnState = { role: Role };

/**
 * One Durable Object == one room. `this.name` IS the 5-char uppercase code.
 * Caps at two connections, assigns "you" / "me", relays WebRTC signaling
 * between the pair, and runs an authoritative photobooth countdown.
 */
export class RoomServer extends Server<Env> {
  static options = { hibernate: false };

  phase: RoomPhase = "idle";
  shotIndex = -1;
  countdownValue: number | null = null;
  private runToken = 0;

  private now() {
    return Date.now();
  }

  private connectedRoles(exclude?: string): Role[] {
    const roles: Role[] = [];
    for (const c of this.getConnections<ConnState>()) {
      if (exclude && c.id === exclude) continue;
      const role = c.state?.role;
      if (role) roles.push(role);
    }
    return roles;
  }

  private buildState(): RoomState {
    const roles = this.connectedRoles();
    return {
      code: this.name,
      phase: this.phase,
      roles,
      bothPresent: roles.length >= 2,
      shotIndex: this.shotIndex,
      totalShots: SHOTS,
      countdownValue: this.countdownValue,
    };
  }

  private send(conn: Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private relay(msg: ServerMessage, without?: string[]) {
    this.broadcast(JSON.stringify(msg), without);
  }

  private broadcastState() {
    this.relay({ t: "state", state: this.buildState(), ts: this.now() });
  }

  private resetSession() {
    this.runToken++;
    this.phase = "idle";
    this.shotIndex = -1;
    this.countdownValue = null;
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  onConnect(conn: Connection<ConnState>, _ctx: ConnectionContext) {
    const used = this.connectedRoles(conn.id);

    // Cap at two people — reject a third.
    if (used.length >= 2) {
      this.send(conn, {
        t: "error",
        code: "room-full",
        message: "This room already has two people.",
        ts: this.now(),
      });
      conn.close(4001, "room-full");
      return;
    }

    const role = ROLES.find((r) => !used.includes(r)) ?? "you";
    conn.setState({ role });

    void this.pingLobby("claim");

    this.send(conn, {
      t: "welcome",
      role,
      self: conn.id,
      state: this.buildState(),
      ts: this.now(),
    });
    this.broadcastState();
  }

  onMessage(sender: Connection<ConnState>, message: WSMessage) {
    if (typeof message !== "string") return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      this.send(sender, {
        t: "error",
        code: "bad-message",
        message: "Malformed message.",
        ts: this.now(),
      });
      return;
    }

    const role = sender.state?.role;
    if (!role) return;

    switch (msg.t) {
      case "signal":
        this.relay(
          { t: "signal", from: role, data: msg.data, ts: this.now() },
          [sender.id]
        );
        break;
      case "photo":
        this.relay(
          {
            t: "photo",
            from: role,
            shotIndex: msg.shotIndex,
            dataUrl: msg.dataUrl,
            ts: this.now(),
          },
          [sender.id]
        );
        break;
      case "start":
        if (this.phase === "idle" && this.connectedRoles().length >= 2) {
          void this.runSequence();
        }
        break;
      case "retake":
        this.resetSession();
        this.broadcastState();
        break;
    }
  }

  onClose(conn: Connection<ConnState>) {
    const remaining = this.connectedRoles(conn.id);
    if (remaining.length < 2 && this.phase !== "idle") {
      this.resetSession();
    }
    this.broadcastState();
    if (remaining.length === 0) void this.pingLobby("release");
  }

  onError(conn: Connection<ConnState>) {
    this.onClose(conn);
  }

  private async runSequence() {
    const token = ++this.runToken;
    const alive = () => token === this.runToken;

    for (let shot = 0; shot < SHOTS; shot++) {
      if (!alive()) return;

      this.phase = "countdown";
      this.shotIndex = shot;
      for (let n = 3; n >= 1; n--) {
        if (!alive()) return;
        this.countdownValue = n;
        this.broadcastState();
        await this.sleep(TIMING.countdownStep);
      }
      if (!alive()) return;

      this.countdownValue = null;
      this.phase = "capturing";
      this.broadcastState();
      this.relay({
        t: "capture",
        shotIndex: shot,
        targetTs: this.now() + TIMING.captureLeadMs,
        ts: this.now(),
      });

      await this.sleep(TIMING.betweenShotsMs);
    }

    if (!alive()) return;
    this.phase = "strip-ready";
    this.shotIndex = SHOTS;
    this.countdownValue = null;
    this.broadcastState();
  }

  private async pingLobby(action: "claim" | "release") {
    try {
      const stub = await getServerByName(this.env.Lobby, "index");
      await stub.fetch("https://lobby/parties/lobby/index", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, code: this.name }),
      });
    } catch {
      // Best-effort; collision-safety degrades gracefully.
    }
  }
}

// ---- Lobby: collision-safe codes + ICE config ----

const RESERVE_TTL = 2 * 60 * 1000;
const ACTIVE_TTL = 12 * 60 * 60 * 1000;

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

export class LobbyServer extends Server<Env> {
  private codes = new Map<string, number>();

  async onStart() {
    const stored =
      (await this.ctx.storage.get<Record<string, number>>("codes")) ?? {};
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
    await this.ctx.storage.put("codes", Object.fromEntries(this.codes));
  }

  private isTaken(code: string): boolean {
    const exp = this.codes.get(code);
    return exp !== undefined && exp > Date.now();
  }

  private async createCode(): Promise<string> {
    this.prune();
    let code = randomCode();
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
    const env = this.env;
    const stun = env.STUN_URLS
      ? env.STUN_URLS.split(",").map((s) => s.trim()).filter(Boolean)
      : DEFAULT_STUN_URLS;

    const servers: IceServerConfig[] = [{ urls: stun }];
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

  async onRequest(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (req.method === "GET") {
      const body: IceConfigResponse = { iceServers: this.iceServers() };
      return json(body);
    }
    if (req.method === "POST") {
      let payload: { action?: string; code?: string } = {};
      try {
        payload = (await req.json()) as typeof payload;
      } catch {
        return json({ error: "bad-json" }, 400);
      }
      switch (payload.action) {
        case "create":
          return json({ code: await this.createCode() });
        case "claim":
          if (payload.code) {
            this.codes.set(payload.code, Date.now() + ACTIVE_TTL);
            await this.persist();
          }
          return json({ ok: true });
        case "release":
          if (payload.code) {
            this.codes.delete(payload.code);
            await this.persist();
          }
          return json({ ok: true });
        default:
          return json({ error: "unknown-action" }, 400);
      }
    }
    return json({ error: "method-not-allowed" }, 405);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env as never)) ||
      new Response("Not found", { status: 404 })
    );
  },
};
