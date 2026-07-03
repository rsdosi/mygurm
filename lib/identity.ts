"use client";

import { useEffect, useState } from "react";
import type { Role } from "./room-protocol";

function cookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name + "=([^;]+)")
  );
  return m ? decodeURIComponent(m[1]) : null;
}

/** The logged-in user's color role (gurm → "you"/pink, ram → "me"/blue). */
export function readRole(): Role | null {
  const v = cookie("mygurm_role");
  return v === "you" || v === "me" ? v : null;
}

export function readName(): string | null {
  return cookie("mygurm_name");
}

export function useIdentity(): { role: Role | null; name: string | null } {
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    setRole(readRole());
    setName(readName());
  }, []);
  return { role, name };
}
