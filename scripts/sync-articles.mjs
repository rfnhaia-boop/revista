// Atualiza o corpo dos ensaios editoriais já publicados para o texto atual do seed.
// Só mexe em artigos do seed (por slug) e só quando o corpo mudou. Guarda cópia do corpo anterior em stdout (use --dry para só ver).
import pg from "pg";
import { editorialSeed } from "../lib/editorial-seed.mjs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente");
const dry = process.argv.includes("--dry");
const client = new pg.Client({ connectionString: url });
await client.connect();
for (const a of editorialSeed) {
  const cur = await client.query("SELECT body FROM articles WHERE slug=$1", [a.slug]);
  if (!cur.rowCount) { console.log("não existe no banco:", a.slug); continue; }
  const old = cur.rows[0].body;
  if (old === a.body) { console.log("já atualizado:", a.slug); continue; }
  console.log(`${dry ? "mudaria" : "atualizando"}: ${a.slug} (${old.length} -> ${a.body.length} caracteres)`);
  if (!dry) await client.query("UPDATE articles SET body=$1 WHERE slug=$2", [a.body, a.slug]);
}
await client.end();
