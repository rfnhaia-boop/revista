import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente");
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query("CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())");
const done = new Set((await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name));
for (const f of readdirSync("drizzle").filter((n) => n.endsWith(".sql")).sort()) {
  if (done.has(f)) continue;
  const sql = readFileSync(`drizzle/${f}`, "utf8").split("--> statement-breakpoint");
  await client.query("BEGIN");
  try {
    for (const s of sql) if (s.trim()) await client.query(s);
    await client.query("INSERT INTO _migrations (name) VALUES ($1)", [f]);
    await client.query("COMMIT");
    console.log("aplicada", f);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}
await client.end();
