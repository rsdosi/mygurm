"use client";

import { useState } from "react";
import Button from "./Button";

function safePath(from?: string): string {
  if (!from) return "/";
  // Only allow same-site absolute paths (guard against open redirects).
  if (!from.startsWith("/") || from.startsWith("//")) return "/";
  return from;
}

export default function UnlockForm({ from }: { from?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !password) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Full navigation so the freshly-set cookie is sent to middleware.
        window.location.assign(safePath(from));
        return;
      }
      setError(true);
      setPassword("");
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
      <label htmlFor="key" className="sr-only">
        Password
      </label>
      <input
        id="key"
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(false);
        }}
        autoFocus
        autoComplete="current-password"
        aria-invalid={error || undefined}
        placeholder="••••••••••"
        className={`w-full rounded-pill border bg-white px-5 py-3.5 text-center text-lg text-ink outline-none transition-colors placeholder:text-muted/40 focus:ring-2 ${
          error
            ? "border-you focus:border-you focus:ring-you/30"
            : "border-line focus:border-me focus:ring-me/40"
        }`}
      />

      <Button type="submit" size="lg" className="w-full" disabled={loading || !password}>
        {loading ? "Unlocking…" : "Unlock"}
      </Button>

      <p
        className={`h-5 text-sm transition-opacity ${
          error ? "text-you-ink opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        that&apos;s not quite it — try again 💗
      </p>
    </form>
  );
}
