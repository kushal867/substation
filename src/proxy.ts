import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/session";

/** Optimistic auth gate for the admin UI and its API (route handlers re-check). */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  let ok = false;
  try {
    ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    ok = false; // missing/short SESSION_SECRET => nobody gets in
  }
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
