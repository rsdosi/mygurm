"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { useDuoVideo } from "@/lib/useDuoVideo";
import { usePhotobooth } from "@/lib/usePhotobooth";
import DuoVideo from "./DuoVideo";
import Photobooth from "./Photobooth";
import Button from "./Button";

function Presence({
  bothPresent,
  connected,
}: {
  bothPresent: boolean;
  connected: boolean;
}) {
  if (bothPresent) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-you" /> you
        </span>
        <span className="text-muted">+</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-me" /> me
        </span>
        <span className="text-muted">connected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-you" />
      {connected ? "waiting for them…" : "connecting…"}
    </span>
  );
}

export default function RoomClient({ code }: { code: string }) {
  const room = useRoom(code);
  const media = useDuoVideo(room);
  const booth = usePhotobooth(room, media);

  const { status, state, self, roomError } = room;
  const connected = status === "online" && self !== null;

  // Copy-to-share.
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined" ? window.location.href : code
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  // "Your partner left" banner — fires when we drop from 2 → 1.
  const [partnerLeft, setPartnerLeft] = useState(false);
  const wasBothRef = useRef(false);
  useEffect(() => {
    if (state.bothPresent) {
      wasBothRef.current = true;
      setPartnerLeft(false);
    } else if (wasBothRef.current) {
      setPartnerLeft(true);
    }
  }, [state.bothPresent]);

  if (roomError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl" aria-hidden="true">
          🔒
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold">
          This room is full
        </h1>
        <p className="mt-2 max-w-sm text-muted">{roomError}</p>
        <div className="mt-6">
          <Button href="/">Start your own room</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-content px-5 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-lg font-semibold lowercase tracking-tight text-ink"
          >
            mygurm
          </Link>
          <span className="hidden text-line sm:inline">/</span>
          <div className="flex items-center gap-2">
            <span className="rounded-pill bg-ink px-3 py-1 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white">
              {code}
            </span>
            <button
              type="button"
              onClick={copy}
              className="rounded-pill border border-line bg-white px-3 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        </div>
        <Presence bothPresent={state.bothPresent} connected={connected} />
      </div>

      {status !== "online" && (
        <p className="mt-4 rounded-card bg-me-soft px-4 py-2 text-sm text-me-ink">
          Reconnecting to the room…
        </p>
      )}

      {partnerLeft && !state.bothPresent && (
        <p className="mt-4 rounded-card bg-you-soft px-4 py-2 text-sm text-you-ink">
          Your partner left the room. Waiting for them to come back…
        </p>
      )}

      {/* Share hint before the partner arrives */}
      {!state.bothPresent && !partnerLeft && (
        <div className="mt-6 rounded-card border border-line bg-white p-5 text-sm text-muted shadow-soft">
          Send this code to your partner:{" "}
          <span className="font-mono font-semibold text-ink">{code}</span>. As
          soon as they join, your cameras connect and you can start the booth.
        </div>
      )}

      {/* Video */}
      <div className="mt-6">
        <DuoVideo media={media} />
      </div>

      {/* Booth */}
      <div className="mt-6">
        <Photobooth
          state={state}
          booth={booth}
          bothPresent={state.bothPresent}
          clipUrl={media.clipUrl}
          code={code}
        />
      </div>
    </div>
  );
}
