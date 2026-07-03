import type { Role } from "./room-protocol";

/**
 * Two-person login. Each user maps to a fixed duotone color used everywhere:
 *   gurm → "you"  → pink
 *   ram  → "me"   → blue
 * Verified server-side (middleware + /api/unlock); credentials never ship to
 * the browser bundle. Passwords are overridable via env.
 */
export type SiteUser = {
  username: string;
  password: string;
  role: Role;
  name: string;
};

export const USERS: SiteUser[] = [
  {
    username: "gurm",
    password: process.env.GURM_PASSWORD || "sweetpea09",
    role: "you",
    name: "gurm",
  },
  {
    username: "ram",
    password: process.env.RAM_PASSWORD || "edamame06",
    role: "me",
    name: "ram",
  },
];

export const UNLOCK_COOKIE = "mygurm_key"; // httpOnly auth token
export const ROLE_COOKIE = "mygurm_role"; // readable: "you" | "me"
export const NAME_COOKIE = "mygurm_name"; // readable: "gurm" | "ram"
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 180; // ~180 days

const SECRET = process.env.SITE_AUTH_SECRET || "mygurm-shared-secret-2026";

/** Opaque per-user token stored in the httpOnly cookie (never the password). */
export async function tokenForUser(u: SiteUser): Promise<string> {
  const data = new TextEncoder().encode(`${SECRET}:${u.username}:${u.password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function findUser(username: string, password: string): SiteUser | null {
  const u = username.trim().toLowerCase();
  return USERS.find((x) => x.username === u && x.password === password) ?? null;
}

/** The set of all valid auth tokens (for middleware verification). */
export async function validTokens(): Promise<Set<string>> {
  const tokens = await Promise.all(USERS.map(tokenForUser));
  return new Set(tokens);
}
