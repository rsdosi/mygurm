"use client";

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

// Vercel serverless request bodies cap at ~4.5MB; keep a margin.
const MAX_UPLOAD_BYTES = 4.3 * 1024 * 1024;

/** Downscale big images client-side so they fit the upload limit. */
async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1.4 * 1024 * 1024) {
    return file;
  }
  try {
    const bmp = await createImageBitmap(file);
    const max = 1800;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.85)
    );
    if (blob && blob.size < file.size) {
      const name = file.name.replace(/\.\w+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    }
  } catch {
    /* fall back to original */
  }
  return file;
}

async function postUpload(fd: FormData): Promise<void> {
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error || `upload failed (${res.status})`);
  }
}

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
    for (const raw of media) {
      const file = await prepareImage(raw);
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `"${raw.name}" is too large to share (max ~4MB${
            raw.type.startsWith("video") ? " for videos" : ""
          }).`
        );
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "photo");
      fd.append("role", role);
      if (eventId) fd.append("eventId", eventId);
      await postUpload(fd);
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
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "strip");
    fd.append("code", code);
    await postUpload(fd);
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
