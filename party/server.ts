import type * as Party from "partykit/server";
import {
  emptyState,
  SHOTS,
  TIMING,
  type ClientMessage,
  type Role,
  type RoomPhase,
  type RoomState,
  type ServerMessage,
} from "../lib/room-protocol";

const ROLES: Role[] = ["you", "me"];

type ConnState = { role: Role };

/**
 * One Party == one room. The room's `id` IS the 5-char uppercase code.
 * Caps at two connections, assigns the "you" / "me" roles, relays WebRTC
 * signaling between the pair, and runs an authoritative photobooth countdown.
 */
export default class RoomServer implements Party.Server {
  readonly options: Party.ServerOptions = { hibernate: false };

  phase: RoomPhase = "idle";
  shotIndex = -1;
  countdownValue: number | null = null;
  /** Bumped whenever a running capture sequence must be abandoned. */
  private runToken = 0;

  constructor(readonly room: Party.Room) {}

  // ---- helpers -------------------------------------------------------------

  private now() {
    return Date.now();
  }

  private connectedRoles(exclude?: string): Role[] {
    const roles: Role[] = [];
    for (const c of this.room.getConnections<ConnState>()) {
      if (exclude && c.id === exclude) continue;
      const role = c.state?.role;
      if (role) roles.push(role);
    }
    return roles;
  }

  private buildState(): RoomState {
    const roles = this.connectedRoles();
    return {
      code: this.room.id,
      phase: this.phase,
      roles,
      bothPresent: roles.length >= 2,
      shotIndex: this.shotIndex,
      totalShots: SHOTS,
      countdownValue: this.countdownValue,
    };
  }

  private broadcast(msg: ServerMessage, without?: string[]) {
    this.room.broadcast(JSON.stringify(msg), without);
  }

  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcastState() {
    this.broadcast({ t: "state", state: this.buildState(), ts: this.now() });
  }

  private resetSession() {
    this.runToken++; // cancel any in-flight sequence
    this.phase = "idle";
    this.shotIndex = -1;
    this.countdownValue = null;
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  // ---- lifecycle -----------------------------------------------------------

  async onConnect(conn: Party.Connection<ConnState>, ctx: Party.ConnectionContext) {
    const used = this.connectedRoles(conn.id);

    // Cap the room at two people — reject a third.
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

    // Claim the code in the lobby so it isn't handed out again while active.
    void this.pingLobby("claim");

    // Send the joiner its role + a full snapshot, then tell everyone about the
    // new presence.
    const state = this.buildState();
    this.send(conn, {
      t: "welcome",
      role,
      self: conn.id,
      state,
      ts: this.now(),
    });
    this.broadcastState();
  }

  async onMessage(raw: string, sender: Party.Connection<ConnState>) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
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
        // Relay WebRTC signaling to the *other* peer only.
        this.broadcast(
          { t: "signal", from: role, data: msg.data, ts: this.now() },
          [sender.id]
        );
        break;

      case "photo":
        // Fallback still relay (used when the data channel is unavailable).
        this.broadcast(
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

  async onClose(conn: Party.Connection<ConnState>) {
    // A peer left: abandon any capture in progress and drop back to idle.
    const remaining = this.connectedRoles(conn.id);
    if (remaining.length < 2 && this.phase !== "idle") {
      this.resetSession();
    }
    this.broadcastState();

    if (remaining.length === 0) {
      void this.pingLobby("release");
    }
  }

  async onError(conn: Party.Connection<ConnState>) {
    await this.onClose(conn);
  }

  // ---- authoritative capture sequence -------------------------------------

  private async runSequence() {
    const token = ++this.runToken;
    const alive = () => token === this.runToken;

    for (let shot = 0; shot < SHOTS; shot++) {
      if (!alive()) return;

      // 3 - 2 - 1 countdown.
      this.phase = "countdown";
      this.shotIndex = shot;
      for (let n = 3; n >= 1; n--) {
        if (!alive()) return;
        this.countdownValue = n;
        this.broadcastState();
        await this.sleep(TIMING.countdownStep);
      }
      if (!alive()) return;

      // Fire: tell both clients to grab a still at the same target instant.
      this.countdownValue = null;
      this.phase = "capturing";
      this.broadcastState();
      this.broadcast({
        t: "capture",
        shotIndex: shot,
        targetTs: this.now() + TIMING.captureLeadMs,
        ts: this.now(),
      });

      // Give clients time to grab + exchange before the next shot.
      await this.sleep(TIMING.betweenShotsMs);
    }

    if (!alive()) return;
    this.phase = "strip-ready";
    this.shotIndex = SHOTS;
    this.countdownValue = null;
    this.broadcastState();
  }

  // ---- lobby coordination (collision-safe codes) --------------------------

  private async pingLobby(action: "claim" | "release") {
    try {
      const lobby = this.room.context.parties.lobby;
      if (!lobby) return;
      await lobby.get("index").fetch({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, code: this.room.id }),
      });
    } catch {
      // Best-effort; collision-safety degrades gracefully to random codes.
    }
  }
}

RoomServer satisfies Party.Worker;
