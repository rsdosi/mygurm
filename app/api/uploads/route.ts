import { NextResponse } from "next/server";
import { list, del, put } from "@vercel/blob";

/**
 * Shared "Pictures of us" store, backed by Vercel Blob. The uploader's role is
 * encoded in the pathname (pictures/<you|me>/…), so no database is needed.
 * When BLOB_READ_WRITE_TOKEN isn't set, the client falls back to on-device
 * storage and these endpoints report `configured: false`.
 */

export const dynamic = "force-dynamic";

const PREFIX = "pictures/";
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg|ogv)$/i;

// Blob is usable either via a read-write token or via Vercel's OIDC
// connection (which injects BLOB_STORE_ID and uses VERCEL_OIDC_TOKEN).
function configured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

// pathname layout: pictures/<role>/<eventId>/<filename>
function parsePath(pathname: string): {
  role: "you" | "me" | null;
  eventId: string | null;
} {
  const parts = pathname.split("/");
  const role =
    parts[0] === "pictures" && (parts[1] === "you" || parts[1] === "me")
      ? parts[1]
      : null;
  const raw = parts[2];
  const eventId = raw && raw !== "untagged" ? raw : null;
  return { role, eventId };
}

export async function GET(request: Request) {
  if (!configured()) {
    return NextResponse.json({ configured: false, items: [] });
  }
  const scope = new URL(request.url).searchParams.get("scope");

  // Photobooth strips: strips/<code>/<file>.png
  if (scope === "strips") {
    const { blobs } = await list({ prefix: "strips/" });
    const items = blobs
      .map((b) => ({
        url: b.url,
        pathname: b.pathname,
        code: b.pathname.split("/")[1] ?? "",
        createdAt: new Date(b.uploadedAt).getTime(),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ configured: true, items });
  }

  const { blobs } = await list({ prefix: PREFIX });
  const items = blobs
    .map((b) => {
      const { role, eventId } = parsePath(b.pathname);
      return {
        url: b.url,
        pathname: b.pathname,
        name: b.pathname.split("/").pop() || "photo",
        role,
        eventId,
        isVideo: VIDEO_RE.test(b.pathname),
        createdAt: new Date(b.uploadedAt).getTime(),
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({ configured: true, items });
}

// Direct server-side upload (multipart form). Works fully behind the password
// gate — no client token exchange or completion webhook to be redirected.
export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "bad-form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no-file" }, { status: 400 });
  }

  const safeName =
    (file.name || "upload").replace(/[^\w.\-]+/g, "_").slice(-60) || "upload";
  const kind = form.get("kind") === "strip" ? "strip" : "photo";

  let pathname: string;
  if (kind === "strip") {
    const code =
      String(form.get("code") || "strip")
        .replace(/[^A-Za-z0-9]/g, "")
        .slice(0, 8) || "strip";
    pathname = `strips/${code}/${safeName}`;
  } else {
    const role = form.get("role") === "me" ? "me" : "you";
    const eventId =
      String(form.get("eventId") || "").replace(/[^\w-]/g, "") || "untagged";
    pathname = `pictures/${role}/${eventId}/${safeName}`;
  }

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!configured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing-url" }, { status: 400 });
  }
  await del(url);
  return NextResponse.json({ ok: true });
}
