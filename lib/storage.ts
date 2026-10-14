import { query, batch } from "@/db/client";

type Row = Record<string, unknown>;

/**
 * Pequena camada D1-compatível sobre Postgres, para manter o SQL auditado
 * das rotas (prepare/bind/first/all/run/batch). Placeholders "?" viram $n.
 */
class Statement {
  constructor(
    readonly sql: string,
    readonly params: unknown[] = [],
  ) {}
  bind(...params: unknown[]) {
    return new Statement(this.sql, params);
  }
  async first<T = Row>(): Promise<T | null> {
    const r = await query(this.sql, this.params);
    return (r.rows[0] as T) ?? null;
  }
  async all<T = Row>(): Promise<{ results: T[] }> {
    const r = await query(this.sql, this.params);
    return { results: r.rows as T[] };
  }
  async run() {
    await query(this.sql, this.params);
    return { success: true };
  }
}

export function database() {
  return {
    prepare: (sql: string) => new Statement(sql),
    batch: (statements: Statement[]) =>
      batch(statements.map((s) => ({ sql: s.sql, params: s.params }))),
  };
}
