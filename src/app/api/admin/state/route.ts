import type { NextRequest } from "next/server";
import { dbConfigured } from "@/server/db";
import { isAuthed, json } from "@/server/http";
import { loadState } from "@/server/state";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAuthed(req))) return json({ ok: false, error: "Unauthorized" }, 401);
  if (!dbConfigured()) return json({ ok: false, error: "DATABASE_URL is not configured on the server." }, 503);
  try {
    return json({ ok: true, state: await loadState() });
  } catch (e) {
    console.error("[state]", e);
    return json({ ok: false, error: "Could not load data from the database. Has db/schema.sql been applied?" }, 500);
  }
}
