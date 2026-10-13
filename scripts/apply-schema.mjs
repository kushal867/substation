// Usage: DATABASE_URL=postgres://... npm run db:apply   (idempotent)
import fs from "node:fs";
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL first."); process.exit(1); }
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(fs.readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
await client.end();
console.log("Schema applied.");
