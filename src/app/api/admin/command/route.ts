import type { NextRequest } from "next/server";
import { runCommand } from "@/server/commands";
import { dbConfigured } from "@/server/db";
import { isAuthed, json, sameOrigin } from "@/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await isAuthed(req))) return json({ ok: false, error: "Unauthorized" }, 401);
  if (!sameOrigin(req)) return json({ ok: false, error: "Bad origin" }, 403);
  if (!dbConfigured()) return json({ ok: false, error: "DATABASE_URL is not configured on the server." }, 503);
  if (Number(req.headers.get("content-length") ?? 0) > 2_000_000) return json({ ok: false, error: "Request too large" }, 413);
  let body: { type?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }
  if (!body || typeof body.type !== "string") return json({ ok: false, error: "Missing command type" }, 400);
  const res = await runCommand(body as { type: string });
  return json(res, res.ok ? 200 : 422);
}
