"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readName } from "@/lib/identity";

type Emote = {
  id: number;
  kind: "smiley" | "heart";
  left: number;
  top: number;
  size: number;
  opacity: number;
  duration: number;
  rotate: number;
};

function Smiley({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
      <circle cx="12" cy="12" r="11" fill="#34C759" />
      <circle cx="8.5" cy="10" r="1.6" fill="#fff" />
      <circle cx="15.5" cy="10" r="1.6" fill="#fff" />
      <path
        d="M7 14.5c1.3 2 3 3 5 3s3.7-1 5-3"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function Heart({ size, opacity }: { size: number; opacity: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity }}>
      <path
        d="M12 21s-7.5-4.7-9.8-9C.7 9 2 5.5 5.2 5.5c2 0 3.2 1.2 3.9 2.4l.9 1.5.9-1.5c.7-1.2 1.9-2.4 3.9-2.4 3.2 0 4.5 3.5 3 6.5-2.3 4.3-9.8 9-9.8 9z"
        fill="#FF5C8A"
      />
    </svg>
  );
}

let seq = 0;

/** On-device fallback key, scoped to the logged-in user so each login keeps its
 *  own local count (mirrors the per-user server counter). */
function localKeyFor(name: string | null): string {
  return name ? `mygurm_rugs_count_${name}` : "mygurm_rugs_count";
}

export default function PetRugs() {
  const [emotes, setEmotes] = useState<Emote[]>([]);
  const [count, setCount] = useState<number | null>(null); // total pets (persisted)
  const [videoOk, setVideoOk] = useState(true);
  const rugsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sharedRef = useRef(false); // is the per-user server counter in use?
  const pendingRef = useRef(0); // un-flushed pets
  const flushTimer = useRef<ReturnType<typeof setTimeout>>();
  const localKeyRef = useRef(localKeyFor(null)); // set once identity is known

  // Show Rugs bobbing once on load so he's never a black frame.
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  // Load the saved total (per-user server counter, else on-device).
  useEffect(() => {
    let alive = true;
    localKeyRef.current = localKeyFor(readName());
    const loadLocal = () => {
      const local = Number(localStorage.getItem(localKeyRef.current) || "0");
      setCount(Number.isFinite(local) ? local : 0);
    };
    fetch("/api/rugs", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.configured) {
          sharedRef.current = true;
          setCount(typeof d.count === "number" ? d.count : 0);
        } else {
          loadLocal();
        }
      })
      .catch(() => {
        if (alive) loadLocal();
      });
    return () => {
      alive = false;
    };
  }, []);

  // Debounced persistence of the accumulated pets.
  const flush = useCallback(() => {
    const delta = pendingRef.current;
    if (delta <= 0) return;
    pendingRef.current = 0;
    if (sharedRef.current) {
      fetch("/api/rugs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delta }),
      })
        .then((r) => r.json())
        .then((d) => {
          // Reconcile with the authoritative shared total (covers the partner
          // petting at the same time).
          if (typeof d.count === "number") {
            setCount((c) => Math.max(c ?? 0, d.count + pendingRef.current));
          }
        })
        .catch(() => {});
    } else {
      setCount((c) => {
        const next = (c ?? 0);
        try {
          localStorage.setItem(localKeyRef.current, String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
  }, []);

  const pet = useCallback(() => {
    // Optimistic bump + queue a debounced save.
    setCount((c) => (c ?? 0) + 1);
    pendingRef.current += 1;
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 900);

    // Play the bobbing animation from the top on every pet.
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }

    // A little tactile pop on top of the video's bob.
    rugsRef.current?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.06)" },
        { transform: "scale(1)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.2,0.8,0.2,1)" }
    );

    // Fill the screen with faint smileys + hearts.
    const batch: Emote[] = Array.from({ length: 22 }, () => {
      seq += 1;
      return {
        id: seq,
        kind: Math.random() < 0.5 ? "smiley" : "heart",
        left: Math.random() * 96 + 2,
        top: Math.random() * 88 + 6,
        size: 26 + Math.random() * 46,
        opacity: 0.14 + Math.random() * 0.24,
        duration: 1.9 + Math.random() * 1.4,
        rotate: Math.random() * 40 - 20,
      };
    });
    setEmotes((cur) => [...cur, ...batch]);
    const ids = new Set(batch.map((b) => b.id));
    window.setTimeout(() => {
      setEmotes((cur) => cur.filter((e) => !ids.has(e.id)));
    }, 3400);
  }, [flush]);

  // Save any pending pets when leaving the page.
  useEffect(() => {
    return () => {
      clearTimeout(flushTimer.current);
      flush();
    };
  }, [flush]);

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-hidden px-5 py-10 text-center">
      {/* Floating emotes layer */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {emotes.map((e) => (
          <span
            key={e.id}
            className="animate-float-up absolute"
            style={
              {
                left: `${e.left}%`,
                top: `${e.top}%`,
                "--o": e.opacity,
                "--d": `${e.duration}s`,
                "--r": `${e.rotate}deg`,
              } as React.CSSProperties
            }
          >
            {e.kind === "smiley" ? (
              <Smiley size={e.size} opacity={1} />
            ) : (
              <Heart size={e.size} opacity={1} />
            )}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <button
          type="button"
          onClick={pet}
          aria-label="Pet Rugs"
          className="group relative outline-none"
        >
          <div ref={rugsRef} className="select-none">
            {videoOk ? (
              <video
                ref={videoRef}
                src="/rugs.mp4"
                muted
                playsInline
                preload="auto"
                onError={() => setVideoOk(false)}
                className="h-72 w-72 rounded-[28px] object-contain drop-shadow-[0_18px_28px_rgba(20,22,28,0.18)] sm:h-[22rem] sm:w-[22rem]"
              />
            ) : (
              <span className="flex h-72 w-72 items-center justify-center text-[11rem] sm:h-[22rem] sm:w-[22rem] sm:text-[14rem]">
                🐆
              </span>
            )}
          </div>
          {/* little shadow pad */}
          <span className="mx-auto mt-2 block h-3 w-40 rounded-full bg-ink/10 blur-md transition-all group-active:w-32" />
        </button>

        <p className="mt-6 font-display text-2xl font-semibold text-ink sm:text-3xl">
          {count === null
            ? " "
            : count === 0
              ? "pet Rugs! 🐆"
              : count < 25
                ? "aww, he's happy!"
                : count < 100
                  ? "he loves you!"
                  : "Rugs is the happiest cheetah alive 💗"}
        </p>
        {count !== null && count > 0 && (
          <p className="mt-2 text-sm text-muted">
            petted{" "}
            <span className="font-semibold text-ink tabular-nums">{count}</span>{" "}
            {count === 1 ? "time" : "times"} · {sharedRef.current ? "saved 💗" : "keep going"}
          </p>
        )}
      </div>
    </div>
  );
}
