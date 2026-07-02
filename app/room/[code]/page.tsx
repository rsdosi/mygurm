import type { Metadata } from "next";
import Link from "next/link";
import RoomClient from "@/components/RoomClient";
import { isValidCode, normalizeCode } from "@/lib/room-protocol";

export const metadata: Metadata = {
  title: "Room",
  robots: { index: false, follow: false },
};

export default function RoomPage({
  params,
}: {
  params: { code: string };
}) {
  const code = normalizeCode(decodeURIComponent(params.code));

  if (!isValidCode(code)) {
    return (
      <div className="mx-auto flex min-h-screen max-w-content flex-col items-center justify-center px-5 text-center">
        <span className="text-4xl" aria-hidden="true">
          🧭
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold">
          That room code looks off
        </h1>
        <p className="mt-2 max-w-sm text-muted">
          Room codes are 5 characters. Double-check the code your partner sent
          you, or start a fresh room.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-pill bg-ink px-6 py-3 text-sm font-medium text-white"
        >
          Back home ▷
        </Link>
      </div>
    );
  }

  return <RoomClient code={code} />;
}
