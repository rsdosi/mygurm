"use client";

import type { DuoVideo as DuoVideoHandle } from "@/lib/useDuoVideo";
import type { Role } from "@/lib/room-protocol";

const TONE = {
  you: {
    border: "border-you",
    bg: "bg-you-soft",
    bg90: "bg-you-soft/90",
    ink: "text-you-ink",
    dot: "bg-you",
    label: "you",
  },
  me: {
    border: "border-me",
    bg: "bg-me-soft",
    bg90: "bg-me-soft/90",
    ink: "text-me-ink",
    dot: "bg-me",
    label: "me",
  },
} as const;

function QualityDot({ q }: { q: DuoVideoHandle["quality"] }) {
  if (!q) return null;
  const color =
    q === "good" ? "bg-emerald-500" : q === "ok" ? "bg-amber-400" : "bg-red-500";
  const label = q === "good" ? "Strong" : q === "ok" ? "OK" : "Weak";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-soft backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ToggleButton({
  on,
  onClick,
  onLabel,
  offLabel,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        on
          ? "bg-white text-ink shadow-soft"
          : "bg-ink text-white"
      }`}
    >
      {on ? onLabel : offLabel}
    </button>
  );
}

export default function DuoVideo({
  media,
  selfRole = "you",
}: {
  media: DuoVideoHandle;
  selfRole?: Role;
}) {
  const {
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
  } = media;

  const reconnecting = connState === "reconnecting" || connState === "failed";
  const local = TONE[selfRole];
  const remote = TONE[selfRole === "you" ? "me" : "you"];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Local — your color */}
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-card border-[3px] ${local.border} ${local.bg} shadow-soft`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
          />
          {!hasLocalMedia && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-3xl" aria-hidden="true">
                {permissionDenied ? "🚫" : "📷"}
              </span>
              <p className={`text-sm font-medium ${local.ink}`}>
                {mediaError ?? "Camera off"}
              </p>
              {permissionDenied && (
                <p className="text-xs text-muted">
                  Allow camera access in your browser, then reload.
                </p>
              )}
            </div>
          )}
          {hasLocalMedia && !camOn && (
            <div
              className={`absolute inset-0 flex items-center justify-center ${local.bg90}`}
            >
              <p className={`text-sm font-medium ${local.ink}`}>Camera paused</p>
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-pill bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-soft backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${local.dot}`} />
            {local.label}
          </span>
        </div>

        {/* Remote — their color */}
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-card border-[3px] ${remote.border} ${remote.bg} shadow-soft`}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          {!remoteActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-3xl animate-float-slow" aria-hidden="true">
                💌
              </span>
              <p className={`text-sm font-medium ${remote.ink}`}>
                {reconnecting ? "Reconnecting…" : "Waiting for them…"}
              </p>
            </div>
          )}
          {remoteActive && reconnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
              <p className="rounded-pill bg-white/90 px-4 py-2 text-sm font-medium text-ink">
                Reconnecting…
              </p>
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-pill bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow-soft backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${remote.dot}`} />
            {remote.label}
          </span>
          <span className="absolute right-3 top-3">
            <QualityDot q={quality} />
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <ToggleButton
          on={camOn}
          onClick={toggleCam}
          onLabel="📷 Camera on"
          offLabel="📷 Camera off"
          disabled={!hasLocalMedia}
        />
        <ToggleButton
          on={micOn}
          onClick={toggleMic}
          onLabel="🎙️ Mic on"
          offLabel="🎙️ Mic off"
          disabled={!hasLocalMedia}
        />
      </div>
    </div>
  );
}
