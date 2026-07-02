"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SHOTS, type Role, type ServerMessage } from "./room-protocol";
import { buildStrip, type ShotPair } from "./strip";
import { newId, saveStrip } from "./gallery";
import type { RoomHandle } from "./useRoom";
import type { DuoVideo } from "./useDuoVideo";

type StillPayload = {
  t: "still";
  shotIndex: number;
  role: Role;
  dataUrl: string;
};

function emptyShots(): ShotPair[] {
  return Array.from({ length: SHOTS }, () => ({ you: null, me: null }));
}

export type Photobooth = {
  /** How many of the SHOTS shots have this client's own still captured. */
  captured: number;
  stripUrl: string | null;
  building: boolean;
  start: () => void;
  retake: () => void;
  downloadStrip: () => void;
};

export function usePhotobooth(
  room: RoomHandle,
  media: DuoVideo
): Photobooth {
  const { self, state, send, subscribe, serverOffsetRef } = room;
  const { grabLocalStill, sendData, onData, startClip, stopClip } = media;

  const roleRef = useRef<Role | null>(self?.role ?? null);
  roleRef.current = self?.role ?? null;

  const shotsRef = useRef<ShotPair[]>(emptyShots());
  const [captured, setCaptured] = useState(0);
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const builtForRef = useRef(false);

  const storeStill = useCallback(
    (shotIndex: number, role: Role, dataUrl: string) => {
      const shot = shotsRef.current[shotIndex];
      if (!shot) return;
      shot[role] = dataUrl;
      if (role === roleRef.current) {
        setCaptured(shotsRef.current.filter((s) => s[role]).length);
      }
    },
    []
  );

  // Receive the peer's stills over the data channel.
  useEffect(() => {
    return onData((obj) => {
      const msg = obj as StillPayload;
      if (msg?.t === "still" && typeof msg.dataUrl === "string") {
        storeStill(msg.shotIndex, msg.role, msg.dataUrl);
      }
    });
  }, [onData, storeStill]);

  // Handle capture triggers + the party-relay fallback for stills.
  useEffect(() => {
    return subscribe((msg: ServerMessage) => {
      if (msg.t === "capture") {
        const role = roleRef.current;
        if (!role) return;
        const shotIndex = msg.shotIndex;
        const fireAt = msg.targetTs - serverOffsetRef.current;
        const delay = Math.max(0, fireAt - Date.now());
        setTimeout(() => {
          const dataUrl = grabLocalStill();
          if (!dataUrl) return;
          storeStill(shotIndex, role, dataUrl);
          const payload: StillPayload = { t: "still", shotIndex, role, dataUrl };
          // Prefer the peer-to-peer data channel; fall back to the party.
          if (!sendData(payload)) {
            send({ t: "photo", shotIndex, dataUrl });
          }
        }, delay);
      } else if (msg.t === "photo") {
        // Fallback still relayed through the party (msg.from is the sender).
        storeStill(msg.shotIndex, msg.from, msg.dataUrl);
      }
    });
  }, [subscribe, serverOffsetRef, grabLocalStill, sendData, send, storeStill]);

  // React to phase changes: build the strip when ready, reset when idle.
  useEffect(() => {
    if (state.phase === "idle") {
      shotsRef.current = emptyShots();
      builtForRef.current = false;
      setCaptured(0);
      setStripUrl((prev) => {
        if (prev) return null;
        return prev;
      });
      return;
    }

    if (state.phase === "strip-ready" && !builtForRef.current) {
      builtForRef.current = true;
      setBuilding(true);
      stopClip();
      // Small grace period so the final still can arrive.
      const timer = setTimeout(async () => {
        const createdAt = Date.now();
        const url = await buildStrip(
          state.code,
          shotsRef.current,
          new Date(createdAt)
        );
        setStripUrl(url);
        setBuilding(false);
        // Auto-save this keepsake to the on-device gallery.
        if (url) {
          try {
            await saveStrip({
              id: newId(),
              code: state.code,
              dataUrl: url,
              createdAt,
            });
          } catch {
            /* gallery is best-effort */
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.code, stopClip]);

  const start = useCallback(() => {
    shotsRef.current = emptyShots();
    builtForRef.current = false;
    setCaptured(0);
    setStripUrl(null);
    startClip();
    send({ t: "start" });
  }, [send, startClip]);

  const retake = useCallback(() => {
    shotsRef.current = emptyShots();
    builtForRef.current = false;
    setCaptured(0);
    setStripUrl(null);
    send({ t: "retake" });
  }, [send]);

  const downloadStrip = useCallback(() => {
    if (!stripUrl) return;
    const a = document.createElement("a");
    a.href = stripUrl;
    a.download = `mygurm-${state.code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [stripUrl, state.code]);

  return { captured, stripUrl, building, start, retake, downloadStrip };
}
