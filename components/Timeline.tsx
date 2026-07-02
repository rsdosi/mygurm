"use client";

import { useEffect, useRef } from "react";
import { memories, type Memory } from "@/lib/memories";

function Tag({ tone, children }: { tone: "you" | "me"; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium ${
        tone === "you" ? "bg-you-soft text-you-ink" : "bg-me-soft text-me-ink"
      }`}
    >
      {children}
    </span>
  );
}

function MemoryCard({ m }: { m: Memory }) {
  const size = m.size ?? "normal";
  const accent = m.tone === "you" ? "text-you" : "text-me";
  const dateSize =
    size === "biggest" ? "text-2xl" : size === "big" ? "text-xl" : "text-lg";
  const titleSize =
    size === "biggest"
      ? "text-2xl sm:text-3xl"
      : size === "big"
        ? "text-xl sm:text-2xl"
        : "text-lg";
  const emojiSize =
    size === "biggest" ? "text-5xl" : size === "big" ? "text-4xl" : "text-3xl";

  const inner = (
    <div
      className={`rounded-card border border-line bg-white shadow-soft ${
        size === "normal" ? "p-6" : "p-7 sm:p-8"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {m.date} · 2026
          </span>
          <h3 className={`mt-1 font-display font-semibold ${titleSize}`}>
            {m.title}
          </h3>
        </div>
        <span className={`shrink-0 leading-none ${emojiSize}`} aria-hidden="true">
          {m.emoji}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        {m.body}
      </p>

      {m.quote && (
        <p
          className={`mt-4 rounded-2xl bg-gradient-to-r from-you-soft to-me-soft px-4 py-3 text-center font-display text-lg italic ${accent}`}
        >
          “{m.quote}”
        </p>
      )}

      {(m.chipotle || m.flowers || size !== "normal") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {size === "biggest" && (
            <Tag tone={m.tone}>💗 the day it began</Tag>
          )}
          {size === "big" && <Tag tone={m.tone}>✨ a big one</Tag>}
          {m.chipotle && <Tag tone={m.tone}>🌯 Chipotle</Tag>}
          {m.flowers && <Tag tone={m.tone}>💐 {m.flowers}</Tag>}
        </div>
      )}
    </div>
  );

  if (size === "biggest") {
    return (
      <div className="rounded-[22px] bg-gradient-to-br from-you to-me p-[3px] shadow-you-glow">
        {inner}
      </div>
    );
  }
  if (size === "big") {
    return <div className="rounded-[21px] ring-2 ring-you/25">{inner}</div>;
  }
  return inner;
}

export default function Timeline() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    cardsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ol className="relative mx-auto max-w-3xl overflow-x-clip">
      {/* the rail */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-5 top-3 w-0.5 bg-gradient-to-b from-you/50 via-line to-me/50 md:left-1/2 md:-translate-x-1/2"
      />

      {memories.map((m, i) => {
        const left = i % 2 === 0;
        const big = m.size && m.size !== "normal";
        return (
          <li key={m.date} className="relative">
            <div
              className={`flex ${left ? "md:flex-row" : "md:flex-row-reverse"} ${
                big ? "my-10 md:my-14" : "my-8 md:my-10"
              }`}
            >
              {/* card side */}
              <div className="w-full pl-14 md:w-1/2 md:pl-0 md:px-10">
                <div
                  ref={(el) => {
                    cardsRef.current[i] = el;
                  }}
                  className={`reveal ${left ? "md:reveal-left" : "md:reveal-right"} ${
                    left ? "md:text-left" : "md:text-left"
                  }`}
                >
                  <MemoryCard m={m} />
                </div>
              </div>
              {/* empty half on desktop */}
              <div className="hidden md:block md:w-1/2" />
            </div>

            {/* node dot */}
            <span
              aria-hidden="true"
              className={`absolute top-8 left-5 -translate-x-1/2 md:left-1/2 md:top-1/2 md:-translate-y-1/2 rounded-full border-4 border-bg ${
                m.tone === "you" ? "bg-you" : "bg-me"
              } ${
                m.size === "biggest"
                  ? "h-7 w-7 animate-heartbeat"
                  : m.size === "big"
                    ? "h-6 w-6"
                    : "h-4 w-4"
              }`}
            />
          </li>
        );
      })}

      {/* the beginning marker */}
      <li className="relative pb-4 pt-2 text-center">
        <p className="text-sm text-muted">…and this is only the beginning 💗</p>
      </li>
    </ol>
  );
}
