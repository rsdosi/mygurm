import { NextResponse, type NextRequest } from "next/server";
import { UNLOCK_COOKIE, unlockToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(UNLOCK_COOKIE)?.value;
  const expected = await unlockToken();

  if (token && token === expected) {
    return NextResponse.next();
  }

  // Not unlocked → send to the lock screen, remembering where they were headed.
  const url = req.nextUrl.clone();
  const from = req.nextUrl.pathname + req.nextUrl.search;
  url.pathname = "/unlock";
  url.search = "";
  if (from && from !== "/") url.searchParams.set("from", from);
  return NextResponse.redirect(url);
}

export const config = {
  // Gate everything except the lock screen, its API, Next internals, and
  // public assets.
  matcher: [
    "/((?!unlock|api/unlock|_next/static|_next/image|opengraph-image|favicon.svg|robots.txt|sitemap.xml).*)",
  ],
};
