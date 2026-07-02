"use client";

import { upload } from "@vercel/blob/client";
import {
  addUpload,
  deleteItem,
  getAllItems,
  getEvents,
  saveEvent,
  saveStrip,
  newId,
  type GalleryItem,
  type StripItem,
  type UploadItem,
  type Role,
} from "./gallery";
import { mergeEvents, type TimelineEvent } from "./memories";

export type { Role } from "./gallery";
export { newId };

export type StoreMode = "remote" | "local";

export type PhotoEntry = {
  id: string;
  url: string;
  name: string;
  isVideo: boolean;
  role: Role | null;
  eventId: string | null;
  createdAt: number;
  source: StoreMode;
};

export type StripEntry = {
  id: string;
  url: string;
  code: string;
  createdAt: number;
  source: StoreMode;
};

const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg|ogv)$/i;
const isVideoFile = (name: string, mime?: string) =>
  Boolean(mime?.startsWith("video")) || VIDEO_RE.test(name);

let modePromise: Promise<StoreMode> | null = null;

/** Is the shared Vercel Blob store configured? Cached after the first check. */
export function resolveMode(): Promise<StoreMode> {
  if (!modePromise) {
    modePromise = fetch("/api/uploads", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { configured: false }))
      .then((d): StoreMode => (d.configured ? "remote" : "local"))
      .catch((): StoreMode => "local");
  }
  return modePromise;
}

// ---- Photos (the shared "Pictures of us") ----

export async function listPhotos(): Promise<PhotoEntry[]> {
  const mode = await resolveMode();
  if (mode === "remote") {
    const res = await fetch("/api/uploads", { cache: "no-store" });
    const data = await res.json();
    const items = (data.items ?? []) as Array<{
      url: string;
      name: string;
      isVideo: boolean;
      role: Role | null;
      eventId: string | null;
      createdAt: number;
    }>;
    return items.map((it) => ({
      id: it.url,
      url: it.url,
      name: it.name,
      isVideo: it.isVideo,
      role: it.role ?? null,
      eventId: it.eventId ?? null,
      createdAt: it.createdAt,
      source: "remote" as const,
    }));
  }
  const raw: GalleryItem[] = await getAllItems().catch(() => []);
  return raw
    .filter((i): i is UploadItem => i.kind === "upload")
    .map((it) => ({
      id: it.id,
      url: URL.createObjectURL(it.blob),
      name: it.name,
      isVideo: isVideoFile(it.name, it.mime),
      role: it.role ?? null,
      eventId: it.eventId ?? null,
      createdAt: it.createdAt,
      source: "local" as const,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addPhotos(
  files: File[],
  role: Role,
  eventId: string | null
): Promise<void> {
  const media = files.filter(
    (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
  );
  if (media.length === 0) return;
  const mode = await resolveMode();
  if (mode === "remote") {
    for (const file of media) {
      const safe = file.name.replace(/[^\w.\-]+/g, "_") || "photo";
      await upload(`pictures/${role}/${eventId || "untagged"}/${safe}`, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        contentType: file.type || undefined,
      });
    }
  } else {
    for (const file of media) await addUpload(file, role, eventId ?? undefined);
  }
}

export async function deletePhoto(entry: PhotoEntry): Promise<void> {
  if (entry.source === "remote") {
    await fetch(`/api/uploads?url=${encodeURIComponent(entry.url)}`, {
      method: "DELETE",
    });
  } else {
    await deleteItem(entry.id);
  }
}

export function revokePhotos(entries: PhotoEntry[]) {
  entries.forEach((e) => {
    if (e.source === "local") URL.revokeObjectURL(e.url);
  });
}

// ---- Strips (photobooths) — shared when configured, else on-device ----

async function localStrips(): Promise<StripEntry[]> {
  const raw: GalleryItem[] = await getAllItems().catch(() => []);
  return raw
    .filter((i): i is StripItem => i.kind === "strip")
    .map((s) => ({
      id: s.id,
      url: s.dataUrl,
      code: s.code,
      createdAt: s.createdAt,
      source: "local" as const,
    }));
}

export async function listStrips(): Promise<StripEntry[]> {
  const mode = await resolveMode();
  const local = await localStrips();
  if (mode !== "remote") return local.sort((a, b) => b.createdAt - a.createdAt);

  // Shared strips from Blob, plus any earlier on-device strips (not lost).
  let remote: StripEntry[] = [];
  try {
    const res = await fetch("/api/uploads?scope=strips", { cache: "no-store" });
    const data = await res.json();
    const items = (data.items ?? []) as Array<{
      url: string;
      code: string;
      createdAt: number;
    }>;
    remote = items.map((it) => ({
      id: it.url,
      url: it.url,
      code: it.code,
      createdAt: it.createdAt,
      source: "remote" as const,
    }));
  } catch {
    /* ignore */
  }
  return [...remote, ...local].sort((a, b) => b.createdAt - a.createdAt);
}

/** Save a finished strip (shared to Blob when configured, else on-device). */
export async function addStrip(dataUrl: string, code: string): Promise<void> {
  const mode = await resolveMode();
  if (mode === "remote") {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${Date.now()}.png`, { type: "image/png" });
    await upload(`strips/${code}/${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/uploads",
      contentType: "image/png",
    });
  } else {
    await saveStrip({ id: newId(), code, dataUrl, createdAt: Date.now() });
  }
}

export async function deleteStrip(entry: StripEntry): Promise<void> {
  if (entry.source === "remote") {
    await fetch(`/api/uploads?url=${encodeURIComponent(entry.url)}`, {
      method: "DELETE",
    });
  } else {
    await deleteItem(entry.id);
  }
}

// ---- Timeline events (seed + user-added) ----

export async function listEvents(): Promise<TimelineEvent[]> {
  const mode = await resolveMode();
  let custom: TimelineEvent[] = [];
  if (mode === "remote") {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        custom = (d.events ?? []) as TimelineEvent[];
      }
    } catch {
      /* ignore */
    }
  } else {
    custom = await getEvents().catch(() => []);
  }
  return mergeEvents(custom);
}

export async function addEvent(evt: TimelineEvent): Promise<void> {
  const mode = await resolveMode();
  if (mode === "remote") {
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(evt),
    });
  } else {
    await saveEvent(evt);
  }
}
