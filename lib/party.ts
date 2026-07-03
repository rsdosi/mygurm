/** Realtime host (Cloudflare Worker running the PartyServer). In dev this is
 * `wrangler dev` (127.0.0.1:8787); in prod it's your
 * `mygurm-party.<subdomain>.workers.dev` host. Set via env. */
export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:8787";

const LOCAL_RE = /^(127\.0\.0\.1|localhost|0\.0\.0\.0)(:\d+)?$/;

/**
 * True when the page is served from a real (deployed) origin but PartyKit is
 * still pointed at localhost — i.e. NEXT_PUBLIC_PARTYKIT_HOST wasn't set on the
 * deployment. In that state rooms can't sync, so we surface a hint.
 */
export function partyHostMisconfigured(): boolean {
  if (typeof window === "undefined") return false;
  const hostIsLocal = LOCAL_RE.test(PARTYKIT_HOST);
  const pageIsLocal = LOCAL_RE.test(window.location.host);
  return hostIsLocal && !pageIsLocal;
}
