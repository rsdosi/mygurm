"use client";

import { PartySocket } from "partysocket";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PARTYKIT_HOST } from "@/lib/party";
import {
  CODE_LENGTH,
  isValidCode,
  normalizeCode,
  randomCode,
} from "@/lib/room-protocol";
import Button from "./Button";

export default function RoomEntry() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  async function createRoom() {
    if (creating) return;
    setCreating(true);
    let code: string | null = null;
    try {
      const res = await PartySocket.fetch(
        { host: PARTYKIT_HOST, party: "lobby", room: "index" },
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "create" }),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { code?: string };
        if (data.code && isValidCode(data.code)) code = data.code;
      }
    } catch {
      // Lobby unreachable — fall back to a client-side random code.
    }
    if (!code) code = randomCode();
    router.push(`/room/${code}`);
  }

  function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeCode(joinCode);
    if (!isValidCode(code)) {
      setJoinError(`Codes are ${CODE_LENGTH} characters.`);
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col gap-4 sm:mt-12">
      <Button
        onClick={createRoom}
        size="lg"
        className="w-full"
        disabled={creating}
      >
        {creating ? "Opening your room…" : "Create a room"}
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted">
        <span className="h-px flex-1 bg-line" />
        or join with a code
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submitJoin} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="join-code" className="sr-only">
          Room code
        </label>
        <input
          id="join-code"
          value={joinCode}
          onChange={(e) => {
            setJoinCode(normalizeCode(e.target.value));
            setJoinError(null);
          }}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={CODE_LENGTH}
          placeholder="ABCDE"
          aria-invalid={joinError ? true : undefined}
          className="w-full flex-1 rounded-pill border border-line bg-white px-5 py-3.5 text-center font-mono text-lg font-semibold uppercase tracking-[0.4em] text-ink outline-none transition-colors placeholder:tracking-[0.4em] placeholder:text-muted/50 focus:border-me focus:ring-2 focus:ring-me/40 sm:text-left sm:tracking-[0.5em]"
        />
        <Button
          type="submit"
          variant="ghost"
          size="lg"
          disabled={joinCode.length !== CODE_LENGTH}
          className="justify-center"
        >
          Join
        </Button>
      </form>

      {joinError && (
        <p className="text-center text-sm text-you-ink sm:text-left">
          {joinError}
        </p>
      )}
    </div>
  );
}
