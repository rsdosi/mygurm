"use client";

import { PartySocket } from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";
import { PARTYKIT_HOST } from "./party";
import {
  DEFAULT_STUN_URLS,
  type IceConfigResponse,
  type Role,
  type ServerMessage,
} from "./room-protocol";
import type { RoomHandle } from "./useRoom";

export type ConnState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export type Quality = "good" | "ok" | "poor" | null;

export type DuoVideo = {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  hasLocalMedia: boolean;
  permissionDenied: boolean;
  mediaError: string | null;
  remoteActive: boolean;
  camOn: boolean;
  micOn: boolean;
  toggleCam: () => void;
  toggleMic: () => void;
  connState: ConnState;
  quality: Quality;
  /** Grab the current local frame as a PNG data URL (null if no camera). */
  grabLocalStill: () => string | null;
  /** Send JSON over the data channel; false if the channel isn't open. */
  sendData: (obj: unknown) => boolean;
  /** Subscribe to JSON received over the data channel. */
  onData: (handler: (obj: unknown) => void) => () => void;
  startClip: () => void;
  stopClip: () => void;
  clipUrl: string | null;
  clipRecording: boolean;
};

async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await PartySocket.fetch({
      host: PARTYKIT_HOST,
      party: "lobby",
      room: "index",
    });
    if (res.ok) {
      const data = (await res.json()) as IceConfigResponse;
      if (Array.isArray(data.iceServers) && data.iceServers.length) {
        return data.iceServers as RTCIceServer[];
      }
    }
  } catch {
    // fall through to STUN-only
  }
  return [{ urls: DEFAULT_STUN_URLS }];
}

export function useDuoVideo(room: RoomHandle): DuoVideo {
  const { self, state, send, subscribe } = room;
  const role: Role | null = self?.role ?? null;
  const bothPresent = state.bothPresent;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [hasLocalMedia, setHasLocalMedia] = useState(false);
  // True once the getUserMedia attempt has settled (granted, denied, or
  // absent). The peer connection must not be created until then, or the
  // second joiner races ahead and negotiates recv-only (never sends media).
  const [mediaSettled, setMediaSettled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteActive, setRemoteActive] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [connState, setConnState] = useState<ConnState>("idle");
  const [quality, setQuality] = useState<Quality>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipRecording, setClipRecording] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const dataHandlersRef = useRef(new Set<(obj: unknown) => void>());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const clipChunksRef = useRef<BlobPart[]>([]);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 1. Acquire local media once (with graceful fallbacks) --------------
  useEffect(() => {
    let cancelled = false;
    async function getMedia() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setMediaError("This browser can't access the camera.");
        setMediaSettled(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setHasLocalMedia(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (cancelled) return;
        const e = err as DOMException;
        if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
          setPermissionDenied(true);
          setMediaError("Camera & mic permission was blocked.");
        } else if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") {
          setMediaError("No camera found — you can still watch your partner.");
        } else {
          setMediaError("Couldn't start your camera.");
        }
      } finally {
        if (!cancelled) setMediaSettled(true);
      }
    }
    void getMedia();
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  // Keep the local <video> wired to the stream even if it mounts later.
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [hasLocalMedia]);

  // ---- 2. Peer connection lifecycle — only while both are present ---------
  useEffect(() => {
    if (!role || !bothPresent || !mediaSettled) return;

    let disposed = false;
    // Capture the remote <video> for cleanup (it's stable once mounted).
    const remoteVideoEl = remoteVideoRef.current;
    // Deterministic caller/callee: "me" calls (offers), "you" answers.
    const polite = role === "you";

    const cleanupFns: Array<() => void> = [];

    async function start() {
      const iceServers = await fetchIceServers();
      if (disposed) return;

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;
      setConnState("connecting");

      // Local tracks, or recv-only transceivers when we have no camera.
      const local = localStreamRef.current;
      if (local) {
        local.getTracks().forEach((track) => pc.addTrack(track, local));
      } else {
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });
      }

      // The impolite peer owns the data channel; the polite peer listens.
      if (!polite) {
        wireDataChannel(pc.createDataChannel("photos", { ordered: true }));
      } else {
        pc.ondatachannel = (e) => wireDataChannel(e.channel);
      }

      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]
          ?.getTracks()
          .forEach((t) => remoteStream.addTrack(t));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setRemoteActive(true);
      };

      // Deterministic roles avoid glare entirely: the impolite peer ("me") is
      // the sole caller (sends offers); the polite peer ("you") only answers.
      // This sidesteps the implicit-rollback path, which doesn't reliably fire
      // `ontrack` for the newly-added remote tracks.
      pc.onnegotiationneeded = async () => {
        if (polite) return; // the callee never initiates
        try {
          await pc.setLocalDescription();
          if (pc.localDescription) {
            send({
              t: "signal",
              data: { kind: "description", description: pc.localDescription },
            });
          }
        } catch {
          // ignore; a later negotiationneeded (or ICE restart) will retry
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        send({ t: "signal", data: { kind: "candidate", candidate } });
      };

      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case "connected":
            setConnState("connected");
            break;
          case "connecting":
            setConnState("connecting");
            break;
          case "disconnected":
            setConnState("reconnecting");
            if (!polite) pc.restartIce();
            break;
          case "failed":
            setConnState("failed");
            if (!polite) pc.restartIce();
            break;
          case "closed":
            setConnState("idle");
            break;
        }
      };

      // Handle inbound signaling relayed through the room.
      const unsub = subscribe(async (msg: ServerMessage) => {
        if (msg.t !== "signal") return;
        const { data } = msg;
        try {
          if (data.kind === "description") {
            const description = data.description;
            await pc.setRemoteDescription(
              description as RTCSessionDescriptionInit
            );
            // The callee ("you") answers the caller's offer.
            if (description.type === "offer") {
              await pc.setLocalDescription();
              if (pc.localDescription) {
                send({
                  t: "signal",
                  data: {
                    kind: "description",
                    description: pc.localDescription,
                  },
                });
              }
            }
          } else if (data.kind === "candidate") {
            try {
              await pc.addIceCandidate(
                (data.candidate ?? undefined) as RTCIceCandidateInit | undefined
              );
            } catch {
              // A candidate can arrive before the remote description is set.
            }
          }
        } catch {
          // swallow — a fresh negotiation will recover the connection
        }
      });
      cleanupFns.push(unsub);

      // Light periodic quality probe.
      statsTimerRef.current = setInterval(async () => {
        try {
          const stats = await pc.getStats();
          let rtt: number | null = null;
          stats.forEach((r) => {
            if (
              (r.type === "candidate-pair" &&
                (r as { nominated?: boolean }).nominated) ||
              r.type === "remote-inbound-rtp"
            ) {
              const v = (r as { currentRoundTripTime?: number; roundTripTime?: number });
              const t = v.currentRoundTripTime ?? v.roundTripTime;
              if (typeof t === "number") rtt = t;
            }
          });
          if (rtt == null) return;
          setQuality(rtt < 0.15 ? "good" : rtt < 0.4 ? "ok" : "poor");
        } catch {
          /* ignore */
        }
      }, 2500);
    }

    function wireDataChannel(channel: RTCDataChannel) {
      dcRef.current = channel;
      channel.onmessage = (e) => {
        try {
          const obj = JSON.parse(e.data as string);
          dataHandlersRef.current.forEach((fn) => fn(obj));
        } catch {
          /* ignore malformed */
        }
      };
      channel.onclose = () => {
        if (dcRef.current === channel) dcRef.current = null;
      };
    }

    void start();

    return () => {
      disposed = true;
      cleanupFns.forEach((fn) => fn());
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
      dcRef.current?.close();
      dcRef.current = null;
      const pc = pcRef.current;
      if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onnegotiationneeded = null;
        pc.onconnectionstatechange = null;
        pc.ondatachannel = null;
        pc.close();
      }
      pcRef.current = null;
      setRemoteActive(false);
      setQuality(null);
      setConnState("idle");
      if (remoteVideoEl) remoteVideoEl.srcObject = null;
    };
  }, [role, bothPresent, mediaSettled, send, subscribe]);

  // ---- toggles ------------------------------------------------------------
  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !stream.getVideoTracks().every((t) => t.enabled);
    stream.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }, []);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !stream.getAudioTracks().every((t) => t.enabled);
    stream.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, []);

  // ---- still capture ------------------------------------------------------
  const grabLocalStill = useCallback((): string | null => {
    const video = localVideoRef.current;
    if (!video || video.videoWidth === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Un-mirror: the preview is flipped for UX, but the keepsake shouldn't be.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // ---- data channel plumbing ---------------------------------------------
  const sendData = useCallback((obj: unknown): boolean => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      dc.send(JSON.stringify(obj));
      return true;
    }
    return false;
  }, []);

  const onData = useCallback((handler: (obj: unknown) => void) => {
    dataHandlersRef.current.add(handler);
    return () => {
      dataHandlersRef.current.delete(handler);
    };
  }, []);

  // ---- optional MediaRecorder clip ---------------------------------------
  const startClip = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") return;
    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      clipChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) clipChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(clipChunksRef.current, { type: "video/webm" });
        setClipUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setClipRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setClipRecording(true);
    } catch {
      /* recording is best-effort */
    }
  }, []);

  const stopClip = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    hasLocalMedia,
    permissionDenied,
    mediaError,
    remoteActive,
    camOn,
    micOn,
    toggleCam,
    toggleMic,
    connState,
    quality,
    grabLocalStill,
    sendData,
    onData,
    startClip,
    stopClip,
    clipUrl,
    clipRecording,
  };
}
