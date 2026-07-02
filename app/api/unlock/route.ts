import { NextResponse } from "next/server";
import {
  SITE_PASSWORD,
  UNLOCK_COOKIE,
  UNLOCK_MAX_AGE,
  unlockToken,
} from "@/lib/auth";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    // ignore malformed body
  }

  if (password !== SITE_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: UNLOCK_COOKIE,
    value: await unlockToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
  return res;
}
