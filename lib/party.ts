/** PartyKit host. In dev this is the local `partykit dev` server; in prod it's
 * your deployed `<project>.<user>.partykit.dev` host. Set via env. */
export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";
