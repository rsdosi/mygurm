"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChipotleCounter from "./ChipotleCounter";
import AddMemory from "./AddMemory";
import Lightbox, { type LightboxItem } from "./Lightbox";
import { addEvent, listEvents, listPhotos, type PhotoEntry } from "@/lib/store";
import type { TimelineEvent } from "@/lib/memories";

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function Tag({
  tone,
  children,
}: {
  tone: "you" | "me";
  children: React.ReactNode;
}) {
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

function MemoryCard({
  m,
  cover,
  onOpenPhotos,
}: {
  m: TimelineEvent;
  cover?: PhotoEntry;
  onOpenPhotos?: () => void;
}) {
  const size = m.size ?? "normal";
  const accent = m.tone === "you" ? "text-you" : "text-me";
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

      {m.body && (
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          {m.body}
        </p>
      )}

      {cover && (
        <button
          type="button"
          onClick={onOpenPhotos}
          className="mt-4 block w-full overflow-hidden rounded-2xl bg-white p-2 shadow-soft transition-transform hover:-translate-y-0.5"
        >
          {cover.isVideo ? (
            <video
              src={cover.url}
              muted
              playsInline
              preload="metadata"
              className="h-40 w-full rounded-xl object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cover.url}
              alt={`A photo from ${m.title}`}
              className="h-40 w-full rounded-xl object-cover"
              loading="lazy"
            />
          )}
          <span className="mt-1.5 flex items-center gap-1.5 px-1 text-[11px] text-muted">
            {cover.role && (
              <span
                className={`h-2 w-2 rounded-full ${
                  cover.role === "you" ? "bg-you" : "bg-me"
                }`}
              />
            )}
            our photos from this day →
          </span>
        </button>
      )}

      {m.quote && (
        <p
          className={`mt-4 rounded-2xl bg-gradient-to-r from-you-soft to-me-soft px-4 py-3 text-center font-display text-lg italic ${accent}`}
        >
          “{m.quote}”
        </p>
      )}

      {(m.chipotle || m.flowers || size !== "normal") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {size === "biggest" && <Tag tone={m.tone}>💗 the day it began</Tag>}
          {size === "big" && <Tag tone={m.tone}>✨ a big one</Tag>}
          {m.chipotle && <Tag tone={m.tone}>🌯 Chipotle</Tag>}
          {m.flowers && <Tag tone={m.tone}>💐 {m.flowers}</Tag>}
          {m.custom && <Tag tone={m.tone}>✍️ added by us</Tag>}
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
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [lb, setLb] = useState<{ items: LightboxItem[]; index: number } | null>(
    null
  );
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  async function load() {
    const [evs, phs] = await Promise.all([
      listEvents().catch(() => []),
      listPhotos().catch(() => []),
    ]);
    setEvents(evs);
    setPhotos(phs);
  }
  useEffect(() => {
    load();
  }, []);

  // eventId -> its photos (oldest first for a natural browse)
  const photosByEvent = useMemo(() => {
    const map = new Map<string, PhotoEntry[]>();
    for (const p of [...photos].sort((a, b) => a.createdAt - b.createdAt)) {
      if (!p.eventId) continue;
      const arr = map.get(p.eventId) ?? [];
      arr.push(p);
      map.set(p.eventId, arr);
    }
    return map;
  }, [photos]);

  const chipotleCount = useMemo(
    () => (events ?? []).filter((e) => e.chipotle).length,
    [events]
  );

  useEffect(() => {
    if (!events) return;
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
  }, [events]);

  function openEventPhotos(eventId: string) {
    const list = photosByEvent.get(eventId) ?? [];
    if (list.length === 0) return;
    setLb({
      items: list.map((p) => ({
        url: p.url,
        isVideo: p.isVideo,
        role: p.role,
        caption: formatWhen(p.createdAt),
      })),
      index: 0,
    });
  }

  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <ChipotleCounter count={chipotleCount} />
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-soft transition-transform hover:-translate-y-0.5"
        >
          ＋ Add a memory
        </button>
      </div>

      <ol className="relative mx-auto mt-14 max-w-3xl overflow-x-clip">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-5 top-3 w-0.5 bg-gradient-to-b from-you/50 via-line to-me/50 md:left-1/2 md:-translate-x-1/2"
        />

        {(events ?? []).map((m, i) => {
          const left = i % 2 === 0;
          const big = m.size && m.size !== "normal";
          const list = photosByEvent.get(m.id);
          return (
            <li key={m.id} className="relative">
              <div
                className={`flex ${left ? "md:flex-row" : "md:flex-row-reverse"} ${
                  big ? "my-10 md:my-14" : "my-8 md:my-10"
                }`}
              >
                <div className="w-full pl-14 md:w-1/2 md:px-10 md:pl-0">
                  <div
                    ref={(el) => {
                      cardsRef.current[i] = el;
                    }}
                    className={`reveal ${left ? "md:reveal-left" : "md:reveal-right"}`}
                  >
                    <MemoryCard
                      m={m}
                      cover={list?.[0]}
                      onOpenPhotos={() => openEventPhotos(m.id)}
                    />
                  </div>
                </div>
                <div className="hidden md:block md:w-1/2" />
              </div>

              <span
                aria-hidden="true"
                className={`absolute left-5 top-8 -translate-x-1/2 rounded-full border-4 border-bg md:left-1/2 md:top-1/2 md:-translate-y-1/2 ${
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

        <li className="relative pb-4 pt-2 text-center">
          <p className="text-sm text-muted">…and this is only the beginning 💗</p>
        </li>
      </ol>

      {adding && (
        <AddMemory
          onClose={() => setAdding(false)}
          onAdd={async (evt) => {
            await addEvent(evt);
            await load();
          }}
        />
      )}

      {lb && (
        <Lightbox
          items={lb.items}
          index={lb.index}
          onClose={() => setLb(null)}
          onIndex={(i) => setLb((s) => (s ? { ...s, index: i } : s))}
        />
      )}
    </>
  );
}
