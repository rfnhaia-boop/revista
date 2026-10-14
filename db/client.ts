import { Pool, types, type QueryResult } from "pg";

// COUNT(*) volta como bigint (string) no pg; as rotas esperam número.
types.setTypeParser(20, (v) => Number(v));

const globalForPool = globalThis as unknown as { __pool?: Pool };

function pool() {
  if (!process.env.DATABASE_URL) throw new Error("Database unavailable");
  return (globalForPool.__pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  }));
}

/** Converte placeholders "?" em $1, $2... e preserva a caixa dos aliases (AS isMine). */
export function toPg(sql: string) {
  let i = 0;
  return sql
    .replace(/\?/g, () => `$${++i}`)
    .replace(/\bAS\s+([A-Za-z_][A-Za-z0-9_]*)\b/g, (_m, a) => `AS "${a}"`);
}

export function query(sql: string, params: unknown[] = []): Promise<QueryResult> {
  return pool().query(toPg(sql), params as unknown[]);
}

export async function batch(items: { sql: string; params: unknown[] }[]) {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    for (const it of items) await client.query(toPg(it.sql), it.params as unknown[]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
