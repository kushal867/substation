import { Pool, type PoolClient } from "pg";

const g = globalThis as unknown as { __pgPool?: Pool };

export function dbConfigured() {
  return !!process.env.DATABASE_URL;
}

export function pool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!g.__pgPool) {
    g.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    g.__pgPool.on("error", (e) => console.error("[pg] idle client error", e.message));
  }
  return g.__pgPool;
}

const transient = (e: unknown) => {
  const x = e as { code?: string; message?: string };
  return ["ECONNRESET", "EPIPE", "57P01", "08006", "08003", "08001"].includes(x.code ?? "") || /Connection terminated|connection error/i.test(x.message ?? "");
};

/** Retries once on a dropped connection (database restart, idle timeout). */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!transient(e)) throw e;
    await new Promise((r) => setTimeout(r, 150));
    return fn();
  }
}

export const query = (sql: string, params: unknown[] = []) => withRetry(() => pool().query(sql, params));

/** Runs fn inside a transaction; rolls back on any error. A dropped connection is retried once. */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  return withRetry(async () => {
    const c = await pool().connect();
    let broken = false;
    try {
      await c.query("BEGIN");
      const r = await fn(c);
      await c.query("COMMIT");
      return r;
    } catch (e) {
      broken = transient(e);
      await c.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally {
      c.release(broken ? true : undefined);
    }
  });
}
