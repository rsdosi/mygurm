"use client";

/**
 * On-device gallery, kept in IndexedDB. It holds two kinds of items:
 *  - "strip"  : a generated four-cut PNG (stored as a data URL)
 *  - "upload" : a photo/video the couple added themselves (stored as a Blob)
 *
 * Everything lives in this browser on this device — there's no shared cloud
 * store in this setup. Swap this module for calls to a blob store (R2/S3) if
 * you want the two of you to share one album across devices.
 */

const DB_NAME = "mygurm";
const STORE = "strips";
const DB_VERSION = 1;

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

/** Add a user-picked photo/video file. Uses the file's own date when known. */
export async function addUpload(file: File): Promise<void> {
  await put({
    id: newId(),
    kind: "upload",
    name: file.name,
    mime: file.type || "application/octet-stream",
    blob: file,
    createdAt: file.lastModified || Date.now(),
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

/** Stable id generator (crypto.randomUUID with a fallback). */
export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
