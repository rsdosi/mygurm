"use client";

import Button from "./Button";
import { SHOTS, type RoomState } from "@/lib/room-protocol";
import type { Photobooth as PhotoboothHandle } from "@/lib/usePhotobooth";

export default function Photobooth({
  state,
  booth,
  bothPresent,
  clipUrl,
  code,
}: {
  state: RoomState;
  booth: PhotoboothHandle;
  bothPresent: boolean;
  clipUrl: string | null;
  code: string;
}) {
  const { phase, shotIndex, countdownValue } = state;
  const { captured, stripUrl, building, start, retake, downloadStrip } = booth;

  // ---- Strip ready ----
  if (phase === "strip-ready") {
    return (
      <div className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Your strip is ready ✨
          </h2>
          <p className="mt-1 text-sm text-muted">
            Four cuts of you + me, from {code}.
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-xs">
          {building || !stripUrl ? (
            <div className="flex aspect-[3/5] items-center justify-center rounded-card bg-bg text-sm text-muted">
              Developing…
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={stripUrl}
              alt={`mygurm photo strip for room ${code}`}
              className="w-full rounded-card shadow-soft-lg"
            />
          )}
        </div>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={downloadStrip} size="lg" disabled={!stripUrl}>
            Download strip
          </Button>
          {clipUrl && (
            <a
              href={clipUrl}
              download={`mygurm-${code}.webm`}
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-white px-7 py-3.5 text-base font-medium text-ink transition-colors hover:border-ink/20"
            >
              🎬 Save clip
            </a>
          )}
          <Button onClick={retake} variant="ghost" size="lg" showArrow={false}>
            ↺ Retake
          </Button>
        </div>
      </div>
    );
  }

  // ---- Countdown / capturing ----
  if (phase === "countdown" || phase === "capturing") {
    return (
      <div className="relative flex min-h-[220px] flex-col items-center justify-center rounded-card border border-line bg-white p-8 text-center shadow-soft">
        <span className="inline-flex items-center gap-2 rounded-pill bg-bg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Shot {Math.min(shotIndex + 1, SHOTS)} / {SHOTS}
        </span>
        <div className="mt-4 flex h-28 items-center justify-center">
          {phase === "countdown" ? (
            <span
              key={countdownValue}
              className="text-duo font-display text-8xl font-semibold"
            >
              {countdownValue}
            </span>
          ) : (
            <span className="font-display text-4xl font-semibold text-ink">
              say cheese! 📸
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">
          Captured {captured}/{SHOTS} on your side
        </p>
      </div>
    );
  }

  // ---- Idle ----
  return (
    <div className="rounded-card border border-line bg-white p-6 text-center shadow-soft sm:p-8">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">
        인생네컷 photo booth
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Four synced shots, one keepsake. When you press start, both cameras
        count down together and snap at the exact same instant.
      </p>
      <div className="mt-6 flex justify-center">
        <Button onClick={start} size="lg" disabled={!bothPresent}>
          {bothPresent ? "Start the booth" : "Waiting for your partner…"}
        </Button>
      </div>
    </div>
  );
}
