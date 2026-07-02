"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import { isoToLabel, type TimelineEvent } from "@/lib/memories";
import { newId, type Role } from "@/lib/store";

export default function AddMemory({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (evt: TimelineEvent) => Promise<void>;
}) {
  const [iso, setIso] = useState("2026-06-15");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emoji, setEmoji] = useState("💗");
  const [tone, setTone] = useState<Role>("you");
  const [chipotle, setChipotle] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    const [, m, d] = iso.split("-").map((x) => parseInt(x, 10));
    const evt: TimelineEvent = {
      id: newId(),
      date: isoToLabel(iso),
      md: (m || 1) * 100 + (d || 1),
      title: title.trim(),
      body: body.trim(),
      emoji: emoji.trim() || "💗",
      tone,
      chipotle: chipotle || undefined,
      custom: true,
    };
    await onAdd(evt);
    setSaving(false);
    onClose();
  }

  const field =
    "w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-me focus:ring-2 focus:ring-me/30";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-card bg-white p-6 shadow-soft-lg sm:p-7"
      >
        <h2 className="font-display text-2xl font-semibold">Add a memory</h2>
        <p className="mt-1 text-sm text-muted">
          A new little moment for our story.
        </p>

        <div className="mt-5 space-y-4">
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">
                Date
              </span>
              <input
                type="date"
                value={iso}
                onChange={(e) => setIso(e.target.value)}
                className={field}
                required
              />
            </label>
            <label className="w-24">
              <span className="mb-1 block text-xs font-medium text-muted">
                Emoji
              </span>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className={`${field} text-center text-lg`}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What happened?"
              className={field}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Story
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Tell it however you'll want to remember it…"
              className={`${field} resize-none`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center gap-1 rounded-pill border border-line p-1">
              <span className="px-2 text-xs text-muted">accent</span>
              <button
                type="button"
                onClick={() => setTone("you")}
                className={`rounded-pill px-3 py-1 text-xs font-medium ${
                  tone === "you" ? "bg-you-soft text-you-ink" : "text-muted"
                }`}
              >
                ● pink
              </button>
              <button
                type="button"
                onClick={() => setTone("me")}
                className={`rounded-pill px-3 py-1 text-xs font-medium ${
                  tone === "me" ? "bg-me-soft text-me-ink" : "text-muted"
                }`}
              >
                ● blue
              </button>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={chipotle}
                onChange={(e) => setChipotle(e.target.checked)}
                className="h-4 w-4 accent-you"
              />
              🌯 Chipotle
            </label>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-medium text-muted hover:text-ink"
          >
            Cancel
          </button>
          <Button type="submit" showArrow={false} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Add to timeline"}
          </Button>
        </div>
      </form>
    </div>
  );
}
