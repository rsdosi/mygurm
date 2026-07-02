import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import type { TimelineEvent } from "@/lib/memories";

/**
 * Shared custom timeline events, stored as a single JSON blob. Small scale
 * (a couple), so a read-modify-write on each add is fine. Falls back to
 * on-device storage on the client when BLOB_READ_WRITE_TOKEN isn't set.
 */

export const dynamic = "force-dynamic";

const PATH = "timeline/events.json";

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readEvents(): Promise<TimelineEvent[]> {
  const { blobs } = await list({ prefix: "timeline/" });
  const found = blobs.find((b) => b.pathname === PATH);
  if (!found) return [];
  try {
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as TimelineEvent[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET() {
  if (!configured()) {
    return NextResponse.json({ configured: false, events: [] });
  }
  const events = await readEvents();
  return NextResponse.json({ configured: true, events });
}

export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }
  let evt: TimelineEvent;
  try {
    evt = (await request.json()) as TimelineEvent;
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  if (!evt?.id || !evt?.title || typeof evt?.md !== "number") {
    return NextResponse.json({ error: "invalid-event" }, { status: 400 });
  }
  const events = await readEvents();
  events.push({ ...evt, custom: true });
  await put(PATH, JSON.stringify(events), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return NextResponse.json({ ok: true, event: evt });
}
