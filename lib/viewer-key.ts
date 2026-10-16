import { createHash } from "node:crypto";

const salt = () => process.env.APP_ORIGIN || "revista";
/** Chave anônima do leitor: nunca guarda IP, e-mail ou id em claro. */
export function viewerKey(userId: string | null, ip: string, ua: string) {
  const raw = userId ? `u:${userId}` : `a:${ip}|${ua.slice(0, 120)}`;
  return createHash("sha256").update(`${salt()}|${raw}`).digest("hex").slice(0, 32);
}

