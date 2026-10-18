import { notFound } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";

/** Garante papel admin para e-mails listados em ADMIN_EMAILS (1º admin, sem mexer no banco). */
export async function ensureBootstrapAdmin(userId: string, email: string) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(email.trim().toLowerCase())) return;
  const now = new Date().toISOString();
  await database()
    .prepare(
      "INSERT INTO member_accounts (owner_id,role,created_at,updated_at) VALUES (?,?,?,?) ON CONFLICT (owner_id) DO UPDATE SET role='admin',updated_at=excluded.updated_at",
    )
    .bind(userId, "admin", now, now)
    .run();
}

/** Para paginas do /admin: nao-equipe recebe 404 (nao revela que a area existe). */
export async function requireStaffPage(adminOnly = false): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !user.isStaff || (adminOnly && !user.isAdmin)) notFound();
  return user;
}

/** Para rotas /api/admin: devolve usuario ou uma Response de erro. */
export async function requireStaffApi(adminOnly = false): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  const h = { "Cache-Control": "private, no-store" };
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401, headers: h });
  if (!user.isStaff || (adminOnly && !user.isAdmin))
    return Response.json({ error: "Sem permissão." }, { status: 403, headers: h });
  return user;
}

export const noStore = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: noStore });

export async function audit(ownerId: string, entityId: string, action: string) {
  await database()
    .prepare("INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)")
    .bind(crypto.randomUUID(), ownerId, entityId, action, new Date().toISOString())
    .run();
}

import type { ZodTypeAny, z } from "zod";
import { validOrigin } from "@/lib/validation";

/** Valida origem + JSON (limite 100 KB) + schema. Retorna dados ou uma Response de erro. */
export async function readBody<S extends ZodTypeAny>(request: Request, schema: S, maxChars = 100_000): Promise<z.infer<S> | Response> {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }
  if (raw.length > maxChars) return json({ error: "Conteúdo muito grande." }, 413);
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "Revise os campos informados." }, 400);
    return parsed.data;
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }
}
