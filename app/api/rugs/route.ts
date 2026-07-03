import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { list, put } from "@vercel/blob";
import { UNLOCK_COOKIE, userFromToken } from "@/lib/auth";

/**
 * Per-user "pet Rugs" counter. Each login gets its OWN count, stored as its own
 * JSON blob (`rugs/<username>.json`) so the two of you never share a total and
 * never race each other's writes. Falls back to on-device storage on the client
 * when Blob isn't configured.
 */

export const dynamic = "force-dynamic";

function configured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

/** The blob path for the currently-logged-in user, or null if unknown. */
async function pathForCaller(): Promise<string | null> {
  const token = cookies().get(UNLOCK_COOKIE)?.value;
  const user = await userFromToken(token);
  return user ? `rugs/${user.username}.json` : null;
}

async function readCount(path: string): Promise<number> {
  const { blobs } = await list({ prefix: "rugs/" });
  const found = blobs.find((b) => b.pathname === path);
  if (!found) return 0;
  try {
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json()) as { count?: number };
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  if (!configured()) {
    return NextResponse.json({ configured: false, count: 0 });
  }
  const path = await pathForCaller();
  if (!path) {
    // Configured but we can't identify the caller — let the client fall back to
    // its own on-device counter rather than pinning it to someone else's total.
    return NextResponse.json({ configured: false, count: 0 });
  }
  return NextResponse.json({ configured: true, count: await readCount(path) });
}

export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json({ configured: false, count: 0 });
  }
  const path = await pathForCaller();
  if (!path) {
    return NextResponse.json({ configured: false, count: 0 });
  }
  let delta = 1;
  try {
    const body = (await request.json()) as { delta?: unknown };
    if (typeof body.delta === "number" && Number.isFinite(body.delta)) {
      delta = Math.max(0, Math.min(1000, Math.floor(body.delta)));
    }
  } catch {
    // default delta 1
  }
  const count = (await readCount(path)) + delta;
  await put(path, JSON.stringify({ count }), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return NextResponse.json({ configured: true, count });
}
