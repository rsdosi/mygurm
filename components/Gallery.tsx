"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "./Button";
import Lightbox, { type LightboxItem } from "./Lightbox";
import {
  addPhotos,
  deletePhoto,
  deleteStrip,
  listEvents,
  listPhotos,
  listStrips,
  resolveMode,
  revokePhotos,
  type PhotoEntry,
  type Role,
  type StripEntry,
  type StoreMode,
} from "@/lib/store";
import type { TimelineEvent } from "@/lib/memories";

export type GalleryMode = "strips" | "uploads";

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Gallery({ mode }: { mode: GalleryMode }) {
  return mode === "strips" ? <StripsGallery /> : <UploadsGallery />;
}

// ---------- Shared polaroid card ----------

function Polaroid({
  url,
  isVideo,
  role,
  date,
  tag,
  onOpen,
  onDownload,
  onRemove,
}: {
  url: string;
  isVideo: boolean;
  role?: Role | null;
  date: string;
  tag?: string;
  onOpen: () => void;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const dot =
    role === "you" ? "bg-you" : role === "me" ? "bg-me" : "bg-muted";
  return (
    <li className="group">
      <figure className="rounded-md bg-white p-2.5 pb-2 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg">
        <div className="relative">
          <button
            type="button"
            onClick={onOpen}
            className="block w-full overflow-hidden rounded-sm bg-bg"
            aria-label="Enlarge"
          >
            {isVideo ? (
              <video
                src={url}
                muted
                playsInline
                preload="metadata"
                className="aspect-square w-full object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={url}
                alt="Memory"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            )}
            {isVideo && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-lg text-ink shadow-soft">
                  ▶
                </span>
              </span>
            )}
          </button>

          <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
            <IconButton title="Download" onClick={onDownload}>
              ⬇
            </IconButton>
            <IconButton title="Remove" onClick={onRemove}>
              ✕
            </IconButton>
          </div>
        </div>

        <figcaption className="flex items-center justify-between gap-2 px-1 pt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
            {role && <span className={`h-2 w-2 rounded-full ${dot}`} />}
            {date}
          </span>
          {tag && (
            <span className="max-w-[55%] truncate rounded-pill bg-bg px-2 py-0.5 text-[10px] font-medium text-muted">
              {tag}
            </span>
          )}
        </figcaption>
      </figure>
    </li>
  );
}

function IconButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs text-ink shadow-soft transition-transform hover:scale-105"
    >
      {children}
    </button>
  );
}

function download(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------- Photobooth strips ----------

function StripsGallery() {
  const [strips, setStrips] = useState<StripEntry[] | null>(null);
  const [storeMode, setStoreMode] = useState<StoreMode | null>(null);
  const [box, setBox] = useState<number | null>(null);

  async function load() {
    setStrips(await listStrips().catch(() => []));
  }
  useEffect(() => {
    load();
    resolveMode().then(setStoreMode);
  }, []);

  const lb: LightboxItem[] = useMemo(
    () =>
      (strips ?? []).map((s) => ({
        url: s.url,
        isVideo: false,
        caption: `${formatWhen(s.createdAt)} · ${s.code}`,
      })),
    [strips]
  );

  if (strips === null) return <p className="text-muted">Opening the album…</p>;

  if (strips.length === 0) {
    return (
      <div className="rounded-card border border-line bg-white p-10 text-center shadow-soft">
        <span className="text-4xl" aria-hidden="true">
          🎞️
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          No strips yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Every four-cut strip the two of you take gets saved here
          automatically. Open a room and make your first one.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/">Create a room</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-muted">
        {storeMode === "remote"
          ? `${strips.length} shared — visible to both of you 💗`
          : `${strips.length} ${strips.length === 1 ? "strip" : "strips"} · saved on this device`}
      </p>
      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {strips.map((s, i) => (
          <Polaroid
            key={s.id}
            url={s.url}
            isVideo={false}
            date={formatWhen(s.createdAt)}
            tag={s.code}
            onOpen={() => setBox(i)}
            onDownload={() => download(s.url, `mygurm-${s.code}.png`)}
            onRemove={async () => {
              await deleteStrip(s);
              load();
            }}
          />
        ))}
      </ul>
      {box !== null && (
        <Lightbox items={lb} index={box} onClose={() => setBox(null)} onIndex={setBox} />
      )}
    </>
  );
}

// ---------- Pictures of us (shared uploads) ----------

const ROLE_KEY = "mygurm_uploader";

function UploadsGallery() {
  const [photos, setPhotos] = useState<PhotoEntry[] | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [storeMode, setStoreMode] = useState<StoreMode | null>(null);
  const [role, setRole] = useState<Role>("you");
  const [eventId, setEventId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [box, setBox] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const photosRef = useRef<PhotoEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ROLE_KEY);
      if (saved === "you" || saved === "me") setRole(saved);
    } catch {
      /* ignore */
    }
    resolveMode().then(setStoreMode);
    listEvents().then(setEvents).catch(() => {});
  }, []);

  function chooseRole(r: Role) {
    setRole(r);
    try {
      localStorage.setItem(ROLE_KEY, r);
    } catch {
      /* ignore */
    }
  }

  async function load() {
    revokePhotos(photosRef.current);
    const list = await listPhotos().catch(() => []);
    photosRef.current = list;
    setPhotos(list);
  }
  useEffect(() => {
    load();
    return () => revokePhotos(photosRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventTitle = useMemo(() => {
    const m = new Map(events.map((e) => [e.id, `${e.date} · ${e.title}`]));
    return (id: string | null) => (id ? m.get(id) ?? "tagged" : undefined);
  }, [events]);

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    await addPhotos(files, role, eventId || null).catch(() => {});
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setBusy(false);
  }

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
  };

  const lb: LightboxItem[] = useMemo(
    () =>
      (photos ?? []).map((p) => ({
        url: p.url,
        isVideo: p.isVideo,
        role: p.role,
        caption: `${formatWhen(p.createdAt)}${
          eventTitle(p.eventId) ? " · " + eventTitle(p.eventId) : ""
        }`,
      })),
    [photos, eventTitle]
  );

  return (
    <div {...dropHandlers} className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
        className="hidden"
      />
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-card ring-2 ring-me ring-offset-4 ring-offset-bg" />
      )}

      {/* Controls: who + event tag */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 rounded-pill border border-line bg-white p-1 text-sm">
          <span className="px-2 text-xs text-muted">uploading as</span>
          <button
            type="button"
            onClick={() => chooseRole("you")}
            className={`rounded-pill px-3 py-1 text-xs font-medium ${
              role === "you" ? "bg-you-soft text-you-ink" : "text-muted"
            }`}
          >
            ● you
          </button>
          <button
            type="button"
            onClick={() => chooseRole("me")}
            className={`rounded-pill px-3 py-1 text-xs font-medium ${
              role === "me" ? "bg-me-soft text-me-ink" : "text-muted"
            }`}
          >
            ● me
          </button>
        </div>

        <label className="inline-flex items-center gap-2 rounded-pill border border-line bg-white px-2 py-1 text-sm">
          <span className="pl-1 text-xs text-muted">tag event</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="rounded-pill bg-transparent py-1 pr-1 text-xs font-medium text-ink outline-none"
          >
            <option value="">No event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.date} · {ev.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Drop zone */}
      <div
        className={`rounded-card border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-me bg-me-soft/60" : "border-line bg-white"
        }`}
      >
        <span className="text-3xl" aria-hidden="true">
          {dragging ? "💞" : "📥"}
        </span>
        <p className="mt-2 font-display text-lg font-semibold">
          {dragging ? "Drop them here!" : "Drag & drop photos & videos"}
        </p>
        <p className="mt-1 text-sm text-muted">
          or pick them from your device
          {eventId ? " — they'll be tagged to your chosen event" : ""}
        </p>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => fileRef.current?.click()}
            size="md"
            showArrow={false}
            disabled={busy}
          >
            {busy ? "Uploading…" : "Browse files"}
          </Button>
        </div>
      </div>

      {/* Status */}
      <p className="mt-4 text-sm text-muted">
        {photos === null
          ? "Opening the album…"
          : storeMode === "remote"
            ? `${photos.length} shared — visible to both of you 💗`
            : `${photos.length} saved on this device`}
      </p>

      {/* Grid */}
      {photos && photos.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <Polaroid
              key={p.id}
              url={p.url}
              isVideo={p.isVideo}
              role={p.role}
              date={formatWhen(p.createdAt)}
              tag={eventTitle(p.eventId)}
              onOpen={() => setBox(i)}
              onDownload={() => download(p.url, p.name || "mygurm-photo")}
              onRemove={async () => {
                await deletePhoto(p).catch(() => {});
                load();
              }}
            />
          ))}
        </ul>
      )}

      {box !== null && (
        <Lightbox items={lb} index={box} onClose={() => setBox(null)} onIndex={setBox} />
      )}
    </div>
  );
}
