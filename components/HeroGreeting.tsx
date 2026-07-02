"use client";

import { useEffect, useRef, useState } from "react";
import { treats } from "@/lib/content";

const LAST_KEY = "mygurm_last_treat";

function randomTreat(exclude?: string): string {
  let w = treats[Math.floor(Math.random() * treats.length)];
  let guard = 0;
  while (exclude && w === exclude && treats.length > 1 && guard++ < 12) {
    w = treats[Math.floor(Math.random() * treats.length)];
  }
  return w;
}

export default function HeroGreeting() {
  // Start on a fixed word so SSR and first client render match (no hydration
  // mismatch); the reel starts spinning once mounted.
  const [word, setWord] = useState(treats[0]);
  const [locked, setLocked] = useState(false);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let last: string | undefined;
    try {
      last = localStorage.getItem(LAST_KEY) ?? undefined;
    } catch {
      /* ignore */
    }
    const final = randomTreat(last);
    try {
      localStorage.setItem(LAST_KEY, final);
    } catch {
      /* ignore */
    }

    let ticks = 0;
    const totalTicks = 20;
    let delay = 55; // decelerating for a slot-machine feel

    const spin = () => {
      ticks += 1;
      if (ticks >= totalTicks) {
        setWord(final);
        setLocked(true);
        return;
      }
      setWord(randomTreat());
      setTick((t) => t + 1);
      delay += 15;
      timerRef.current = setTimeout(spin, delay);
    };

    // A tiny beat, then roll.
    timerRef.current = setTimeout(spin, 260);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-hidden px-5 text-center">
      <span className="blob left-[-10%] top-[6%] h-72 w-72 bg-you/25 animate-float-slow" />
      <span className="blob right-[-10%] bottom-[8%] h-80 w-80 bg-me/20 animate-float-slow [animation-delay:-3s]" />

      <div className="relative">
        <p className="font-display font-semibold uppercase leading-none tracking-tight text-ink text-[clamp(2.5rem,9vw,7.5rem)]">
          hi my little
        </p>

        <div
          className="mt-3 flex min-h-[1.05em] items-center justify-center sm:mt-5"
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            key={locked ? "final" : `roll-${tick}`}
            className={`inline-block break-words px-2 font-display font-semibold leading-[0.9] text-duo text-[clamp(3.25rem,17vw,13rem)] ${
              locked ? "animate-slot-pop" : "animate-slot-roll"
            }`}
          >
            {word}
          </span>
        </div>
      </div>

      <a
        href="#start"
        aria-label="Scroll down"
        className="absolute bottom-8 inline-flex flex-col items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        <span className="uppercase tracking-[0.2em]">scroll</span>
        <span className="animate-bounce text-lg" aria-hidden="true">
          ▽
        </span>
      </a>
    </section>
  );
}
