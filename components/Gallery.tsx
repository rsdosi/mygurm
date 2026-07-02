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
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const viewsRef = useRef<ViewItem[]>([]);
  const dragDepth = useRef(0);

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

  async function handleFiles(files: File[]) {
    const media = files.filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (media.length === 0) return;
    setBusy(true);
    for (const file of media) {
      await addUpload(file).catch(() => {});
    }
    await load();
    setBusy(false);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    await handleFiles(Array.from(e.target.files ?? []));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(id: string) {
    await deleteItem(id).catch(() => {});
    await load();
  }

  // Drag-and-drop for the uploads tab.
  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
    },
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

  const hiddenInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*,video/*"
      multiple
      onChange={onPick}
      className="hidden"
    />
  );

  const dropZone = (
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
      <p className="mt-1 text-sm text-muted">or pick them from your device</p>
      <div className="mt-4 flex justify-center">
        <Button
          onClick={() => fileRef.current?.click()}
          size="md"
          showArrow={false}
          disabled={busy}
        >
          {busy ? "Adding…" : "Browse files"}
        </Button>
      </div>
    </div>
  );

  if (items === null) {
    return <p className="text-muted">Opening the album…</p>;
  }

  // ---- Strips (photobooths) tab ----
  if (mode === "strips") {
    if (items.length === 0) {
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
    return <ItemGrid items={items} onDownload={downloadItem} onRemove={remove} />;
  }

  // ---- Uploads (pictures of us) tab — drag & drop enabled ----
  return (
    <div {...dropHandlers} className="relative">
      {hiddenInput}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-card ring-2 ring-me ring-offset-4 ring-offset-bg" />
      )}

      <div className="mb-6">{dropZone}</div>

      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">
          Add your favorite photos and videos of the two of you — they&apos;ll
          live here alongside your strips.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted">
            {items.length} {items.length === 1 ? "keepsake" : "keepsakes"} ·
            saved on this device
          </p>
          <ItemGrid items={items} onDownload={downloadItem} onRemove={remove} />
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Pill tone="me">psst</Pill>
            <p className="text-sm text-muted">
              Everything lives in this browser on this device. To carry a memory
              somewhere else, just download it.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ItemGrid({
  items,
  onDownload,
  onRemove,
}: {
  items: ViewItem[];
  onDownload: (item: ViewItem) => void;
  onRemove: (id: string) => void;
}) {
  return (
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
              onClick={() => onDownload(item)}
              className="flex-1 rounded-pill bg-ink px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Remove"
              className="rounded-pill border border-line px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-you hover:text-you-ink"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
