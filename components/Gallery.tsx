"use client";

import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import Pill from "./Pill";
import {
  addUpload,
  deleteItem,
  getAllItems,
  type GalleryItem,
} from "@/lib/gallery";

/** "strips" = generated four-cut photobooths · "uploads" = added photos/videos */
export type GalleryMode = "strips" | "uploads";

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ViewItem = GalleryItem & { src: string; isVideo: boolean };

function toView(item: GalleryItem): ViewItem {
  if (item.kind === "upload") {
    return {
      ...item,
      src: URL.createObjectURL(item.blob),
      isVideo: item.mime.startsWith("video"),
    };
  }
  return { ...item, src: item.dataUrl, isVideo: false };
}

function downloadItem(item: ViewItem) {
  const a = document.createElement("a");
  a.href = item.src;
  a.download =
    item.kind === "upload"
      ? item.name || `mygurm-${item.id.slice(0, 6)}`
      : `mygurm-${item.code}-${item.id.slice(0, 6)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function Gallery({ mode }: { mode: GalleryMode }) {
  const [items, setItems] = useState<ViewItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const viewsRef = useRef<ViewItem[]>([]);

  function revokeAll() {
    viewsRef.current.forEach((v) => {
      if (v.kind === "upload") URL.revokeObjectURL(v.src);
    });
  }

  async function load() {
    const raw = await getAllItems().catch(() => []);
    const wantStrip = mode === "strips";
    const filtered = raw.filter((it) =>
      wantStrip ? it.kind === "strip" : it.kind === "upload"
    );
    revokeAll();
    const views = filtered.map(toView);
    viewsRef.current = views;
    setItems(views);
  }

  useEffect(() => {
    load();
    return () => revokeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    for (const file of files) {
      await addUpload(file).catch(() => {});
    }
    if (fileRef.current) fileRef.current.value = "";
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    await deleteItem(id).catch(() => {});
    await load();
  }

  const uploadButton = mode === "uploads" && (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
      <Button
        onClick={() => fileRef.current?.click()}
        size="lg"
        showArrow={false}
        disabled={busy}
      >
        {busy ? "Adding…" : "＋ Upload photos & videos"}
      </Button>
    </>
  );

  if (items === null) {
    return <p className="text-muted">Opening the album…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-line bg-white p-10 text-center shadow-soft">
        <span className="text-4xl" aria-hidden="true">
          {mode === "strips" ? "🎞️" : "📷"}
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold">
          {mode === "strips" ? "No strips yet" : "No photos yet"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted">
          {mode === "strips"
            ? "Every four-cut strip the two of you take gets saved here automatically. Open a room and make your first one."
            : "Add your favorite photos and videos of the two of you — they'll live here alongside your strips."}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {mode === "strips" ? <Button href="/">Create a room</Button> : uploadButton}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "keepsake" : "keepsakes"} · saved
          on this device
        </p>
        {uploadButton}
      </div>

      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col rounded-card border border-line bg-white p-3 shadow-soft transition-shadow hover:shadow-soft-lg"
          >
            <div className="overflow-hidden rounded-2xl bg-bg">
              {item.isVideo ? (
                <video
                  src={item.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.src}
                  alt={
                    item.kind === "strip"
                      ? `Photo strip from room ${item.code}`
                      : item.name || "Uploaded memory"
                  }
                  loading="lazy"
                  className="w-full"
                />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-ink">
                {formatWhen(item.createdAt)}
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                {item.kind === "strip"
                  ? item.code
                  : item.isVideo
                    ? "clip"
                    : "photo"}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => downloadItem(item)}
                className="flex-1 rounded-pill bg-ink px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Remove"
                className="rounded-pill border border-line px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-you hover:text-you-ink"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <Pill tone="me">psst</Pill>
        <p className="text-sm text-muted">
          Everything lives in this browser on this device. To carry a memory
          somewhere else, just download it.
        </p>
      </div>
    </>
  );
}
