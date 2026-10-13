import type { NextRequest } from "next/server";
import { authConfigured, checkPassword } from "@/server/password";
import { clientIp, json, sameOrigin } from "@/server/http";
import { rateLimit, resetLimit } from "@/server/ratelimit";
import { createSession, SESSION_COOKIE, SESSION_TTL_S } from "@/server/session";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ ok: false, error: "Bad origin" }, 403);
  if (!authConfigured()) return json({ ok: false, error: "Server auth is not configured (ADMIN_PASSWORD_HASH and SESSION_SECRET)." }, 503);
  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`);
  if (!rl.ok) return json({ ok: false, error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} min.` }, 429, { "Retry-After": String(rl.retryAfter) });
  let password = "";
  try {
    password = String(((await req.json()) as { password?: string }).password ?? "");
  } catch {
    return json({ ok: false, error: "Invalid request" }, 400);
  }
  if (!password || password.length > 200 || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 400));
    return json({ ok: false, error: "Wrong password." }, 401);
  }
  resetLimit(`login:${ip}`);
  const res = json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${await createSession()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_S}${process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1" ? "; Secure" : ""}`,
  );
  return res;
}
