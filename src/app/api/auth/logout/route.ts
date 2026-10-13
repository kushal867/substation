import { json } from "@/server/http";
import { SESSION_COOKIE } from "@/server/session";

export async function POST() {
  const res = json({ ok: true });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  return res;
}
