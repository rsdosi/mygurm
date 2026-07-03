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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !username || !password) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        // Full navigation so the freshly-set cookies reach middleware + client.
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

  const field =
    "w-full rounded-pill border bg-white px-5 py-3.5 text-center text-lg text-ink outline-none transition-colors placeholder:text-muted/40 focus:ring-2";
  const tone = error
    ? "border-you focus:border-you focus:ring-you/30"
    : "border-line focus:border-me focus:ring-me/40";

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
      <label htmlFor="username" className="sr-only">
        Username
      </label>
      <input
        id="username"
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          setError(false);
        }}
        autoFocus
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="who are you?"
        className={`${field} ${tone}`}
      />

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
        autoComplete="current-password"
        aria-invalid={error || undefined}
        placeholder="••••••••••"
        className={`${field} ${tone}`}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading || !username || !password}
      >
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
