import { createHash, randomBytes } from "node:crypto";
import { mailCompany, sendMail } from "@/lib/mailer";
import { passwordChangedMail, passwordResetMail } from "@/lib/mail-templates";
import { hashPassword } from "@/lib/password";
import { database } from "@/lib/storage";

export const RESET_MINUTES = 60;
const digest = (t: string) => createHash("sha256").update(t).digest("hex");

/**
 * Cria o pedido e manda o e-mail. Quem chama responde sempre igual, exista a conta ou não
 * (não revela quais e-mails estão cadastrados).
 */
export async function requestReset(email: string) {
  const db = database();
  const user = await db.prepare("SELECT id,name FROM users WHERE email=?").bind(email).first<{ id: string; name: string }>();
  if (!user) return;
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  // Um pedido novo invalida os anteriores.
  await db.batch([
    db.prepare("UPDATE password_resets SET used_at=? WHERE user_id=? AND used_at IS NULL").bind(now.toISOString(), user.id),
    db
      .prepare("INSERT INTO password_resets (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
      .bind(digest(token), user.id, new Date(now.getTime() + RESET_MINUTES * 60_000).toISOString(), now.toISOString()),
  ]);
  const origin = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
  void sendMail(email, "password-reset", passwordResetMail(mailCompany(), { name: user.name, link: `${origin}/redefinir-senha?token=${token}`, minutes: RESET_MINUTES })).catch(() => {});
}

export async function resetTokenValid(token: string) {
  if (token.length < 20) return false;
  const row = await database()
    .prepare("SELECT 1 AS ok FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>?")
    .bind(digest(token), new Date().toISOString())
    .first();
  return !!row;
}

/** Troca a senha, consome o token e derruba todas as sessões da conta. Devolve false se o token não vale. */
export async function applyReset(token: string, password: string) {
  const db = database();
  const now = new Date().toISOString();
  const used = await db
    .prepare("UPDATE password_resets SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>? RETURNING user_id")
    .bind(now, digest(token), now)
    .first<{ user_id: string }>();
  if (!used) return false;
  const passwordHash = await hashPassword(password);
  await db.batch([
    db.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(passwordHash, used.user_id),
    db.prepare("DELETE FROM sessions WHERE user_id=?").bind(used.user_id),
    db.prepare("INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), used.user_id, used.user_id, "auth.password_reset", now),
  ]);
  const u = await db.prepare("SELECT email,name FROM users WHERE id=?").bind(used.user_id).first<{ email: string; name: string }>();
  if (u) void sendMail(u.email, "password-changed", passwordChangedMail(mailCompany(), { name: u.name })).catch(() => {});
  return true;
}
