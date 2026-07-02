"use client";

import { PartySocket } from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { PARTYKIT_HOST } from "./party";
import {
  emptyState,
  type ClientMessage,
  type Role,
  type RoomState,
  type ServerMessage,
} from "./room-protocol";

export type ConnectionStatus = "connecting" | "online" | "offline";

export type RoomHandle = {
  status: ConnectionStatus;
  state: RoomState;
  self: { role: Role; id: string } | null;
  /** Set when the server rejects us (e.g. the room is already full). */
  roomError: string | null;
  send: (msg: ClientMessage) => void;
  /** Subscribe to raw server messages. Returns an unsubscribe fn. */
  subscribe: (handler: (msg: ServerMessage) => void) => () => void;
  /** Estimated (serverClock - clientClock) in ms, for synced captures. */
  serverOffsetRef: React.MutableRefObject<number>;
};

export function useRoom(code: string): RoomHandle {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [state, setState] = useState<RoomState>(() => emptyState(code));
  const [self, setSelf] = useState<{ role: Role; id: string } | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const subscribersRef = useRef(new Set<(msg: ServerMessage) => void>());
  const serverOffsetRef = useRef(0);

  useEffect(() => {
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      party: "main",
      room: code,
      // Built-in exponential-backoff reconnect + send buffering.
      maxReconnectionDelay: 8000,
      minReconnectionDelay: 500,
      maxEnqueuedMessages: 64,
    });
    socketRef.current = socket;

    const onOpen = () => setStatus("online");
    const onClose = () => setStatus((s) => (s === "online" ? "connecting" : s));
    const onError = () => setStatus("connecting");

    const onMessage = (event: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        return;
      }

      // Smooth the server/client clock offset for capture scheduling.
      if (typeof msg.ts === "number") {
        const sample = msg.ts - Date.now();
        serverOffsetRef.current =
          serverOffsetRef.current === 0
            ? sample
            : serverOffsetRef.current * 0.8 + sample * 0.2;
      }

      switch (msg.t) {
        case "welcome":
          setSelf({ role: msg.role, id: msg.self });
          setState(msg.state);
          setStatus("online");
          break;
        case "state":
          setState(msg.state);
          break;
        case "error":
          setRoomError(msg.message);
          break;
      }

      subscribersRef.current.forEach((fn) => fn(msg));
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("error", onError);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("message", onMessage);
      socket.close();
      socketRef.current = null;
      setStatus("offline");
    };
  }, [code]);

  const send = useCallback((msg: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket) return;
    // ReconnectingWebSocket buffers when not yet open, so this is safe to call
    // during (re)connection.
    socket.send(JSON.stringify(msg));
  }, []);

  const subscribe = useCallback(
    (handler: (msg: ServerMessage) => void) => {
      subscribersRef.current.add(handler);
      return () => {
        subscribersRef.current.delete(handler);
      };
    },
    []
  );

  return { status, state, self, roomError, send, subscribe, serverOffsetRef };
}
