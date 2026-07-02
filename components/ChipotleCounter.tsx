"use client";

import { useEffect, useRef, useState } from "react";

export default function ChipotleCounter({ count }: { count: number }) {
  const [n, setN] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const duration = 900;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(eased * count));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  return (
    <div
      ref={ref}
      className="inline-flex items-center gap-4 rounded-card border border-line bg-white px-6 py-4 shadow-soft"
    >
      <span className="text-4xl" aria-hidden="true">
        🌯
      </span>
      <div className="text-left">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold text-duo tabular-nums sm:text-5xl">
            {n}
          </span>
          <span className="text-sm font-medium text-muted">
            Chipotle runs
          </span>
        </div>
        <p className="text-xs text-muted">…and counting 💗</p>
      </div>
    </div>
  );
}
