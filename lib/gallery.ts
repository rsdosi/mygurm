"use client";

import type { TimelineEvent } from "./memories";

/**
 * On-device store (IndexedDB), used as the fallback when the shared Vercel Blob
 * store isn't configured. Holds:
 *  - "strips" : generated four-cut PNGs + user-uploaded photos/videos
 *  - "events" : custom timeline memories added by a user
 */

const DB_NAME = "mygurm";
const STORE = "strips";
const EVENTS = "events";
const DB_VERSION = 2;

export type Role = "you" | "me";

export type StripItem = {
  id: string;
  kind: "strip";
  code: string;
  dataUrl: string;
  createdAt: number;
};

export type UploadItem = {
  id: string;
  kind: "upload";
  name: string;
  mime: string;
  blob: Blob;
  createdAt: number;
  role?: Role;
  /** Timeline event this photo is tagged to, if any. */
  eventId?: string;
};

export type GalleryItem = StripItem | UploadItem;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(EVENTS)) {
        db.createObjectStore(EVENTS, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function put(item: GalleryItem): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(item);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

/** Save a generated four-cut strip. */
export async function saveStrip(rec: {
  id: string;
  code: string;
  dataUrl: string;
  createdAt: number;
}): Promise<void> {
  await put({ kind: "strip", ...rec });
}

/** Add a user-picked photo/video, optionally tagged to a role + event. */
export async function addUpload(
  file: File,
  role?: Role,
  eventId?: string
): Promise<void> {
  await put({
    id: newId(),
    kind: "upload",
    name: file.name,
    mime: file.type || "application/octet-stream",
    blob: file,
    createdAt: file.lastModified || Date.now(),
    role,
    eventId,
  });
}

export async function getAllItems(): Promise<GalleryItem[]> {
  const db = await openDB();
  const items = await new Promise<GalleryItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as GalleryItem[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteItem(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// ---- Custom timeline events ----

export async function saveEvent(evt: TimelineEvent): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(EVENTS, "readwrite");
    tx.objectStore(EVENTS).put(evt);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getEvents(): Promise<TimelineEvent[]> {
  const db = await openDB();
  const events = await new Promise<TimelineEvent[]>((resolve, reject) => {
    const tx = db.transaction(EVENTS, "readonly");
    const req = tx.objectStore(EVENTS).getAll();
    req.onsuccess = () => resolve((req.result as TimelineEvent[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return events;
}

/** Stable id generator (crypto.randomUUID with a fallback). */
export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
