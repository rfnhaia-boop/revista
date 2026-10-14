// Postgres local de desenvolvimento (sem Docker). Dados em .pgdata/
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dir = ".pgdata";
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "revista",
  password: "revista",
  port: 5437,
  persistent: true,
});
if (!existsSync(`${dir}/PG_VERSION`)) await pg.initialise();
await pg.start();
try { await pg.createDatabase("revista"); } catch {}
console.log("Postgres dev pronto em postgres://revista:revista@localhost:5437/revista");
const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
