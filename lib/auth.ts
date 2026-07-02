/**
 * Tiny password gate. Not hardened security — just a sweet lock screen so the
 * site stays between the two of you. The password is verified server-side and
 * never shipped to the client; the cookie holds an opaque hash, not the word.
 */
export const SITE_PASSWORD =
  process.env.SITE_PASSWORD || "edamamesweetpea0609";

export const UNLOCK_COOKIE = "mygurm_key";
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 180; // ~180 days

/** Deterministic opaque token stored in the cookie (works in edge + node). */
export async function unlockToken(
  password: string = SITE_PASSWORD
): Promise<string> {
  const data = new TextEncoder().encode(`mygurm:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
