import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

/**
 * Shared "Pictures of us" store, backed by Vercel Blob. The uploader's role is
 * encoded in the pathname (pictures/<you|me>/…), so no database is needed.
 * When BLOB_READ_WRITE_TOKEN isn't set, the client falls back to on-device
 * storage and these endpoints report `configured: false`.
 */

export const dynamic = "force-dynamic";

const PREFIX = "pictures/";
const VIDEO_RE = /\.(mp4|webm|mov|m4v|ogg|ogv)$/i;

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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

export async function POST(request: Request) {
  if (!configured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 501 });
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/*", "video/*"],
        addRandomSuffix: true,
        maximumSizeInBytes: 200 * 1024 * 1024,
      }),
      // Metadata lives in the pathname, so nothing to persist on completion.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
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
