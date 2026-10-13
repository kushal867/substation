import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";

export const json = (data: unknown, status = 200, headers?: Record<string, string>) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function isAuthed(req: NextRequest) {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

/** Blocks cross-site form posts: Origin (when present) must match the Host we are served on. */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
