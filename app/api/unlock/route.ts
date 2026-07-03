import { NextResponse } from "next/server";
import {
  NAME_COOKIE,
  ROLE_COOKIE,
  UNLOCK_COOKIE,
  UNLOCK_MAX_AGE,
  findUser,
  tokenForUser,
} from "@/lib/auth";

export async function POST(req: Request) {
  let username = "";
  let password = "";
  try {
    const body = (await req.json()) as { username?: unknown; password?: unknown };
    if (typeof body.username === "string") username = body.username;
    if (typeof body.password === "string") password = body.password;
  } catch {
    // ignore malformed body
  }

  const user = findUser(username, password);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true, role: user.role, name: user.name });

  res.cookies.set({
    name: UNLOCK_COOKIE,
    value: await tokenForUser(user),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
  // Readable by the client so the UI knows its color / name.
  res.cookies.set({
    name: ROLE_COOKIE,
    value: user.role,
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
  res.cookies.set({
    name: NAME_COOKIE,
    value: user.name,
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });
  return res;
}
