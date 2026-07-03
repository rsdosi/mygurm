import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

/**
 * Shared "pet Rugs" counter, stored as a single JSON blob so it persists across
 * refreshes and is shared between both of you. Falls back to on-device storage
 * on the client when Blob isn't configured.
 */

export const dynamic = "force-dynamic";

const PATH = "rugs/count.json";

function configured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

async function readCount(): Promise<number> {
  const { blobs } = await list({ prefix: "rugs/" });
  const found = blobs.find((b) => b.pathname === PATH);
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
  return NextResponse.json({ configured: true, count: await readCount() });
}

export async function POST(request: Request) {
  if (!configured()) {
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
  const count = (await readCount()) + delta;
  await put(PATH, JSON.stringify({ count }), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return NextResponse.json({ configured: true, count });
}
