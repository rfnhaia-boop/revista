import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { database } from "@/lib/storage";
import { privateReviewMode } from "./runtime-mode";

export type CurrentUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  role: string;
  isStaff: boolean;
  isAdmin: boolean;
};

export const STAFF_ROLES = ["admin", "editorial"];

export const SESSION_COOKIE = "revista_session";
export const DEV_COOKIE_NAME = "revista_dev_auth";
const SESSION_DAYS = 30;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Usuario falso, somente em desenvolvimento local. Nunca vale em producao. */
export function devAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DEV_FAKE_USER === "1";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86400000);
  await database()
    .prepare("INSERT INTO sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
    .bind(sha256(token), userId, expires.toISOString(), now.toISOString())
    .run();
  return { token, maxAge: SESSION_DAYS * 86400 };
}

export function sessionCookie(token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export async function destroySession(token: string) {
  await database().prepare("DELETE FROM sessions WHERE token_hash=?").bind(sha256(token)).run();
}

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  if (privateReviewMode()) return null;
  const jar = await cookies();
  if (devAuthEnabled() && jar.get(DEV_COOKIE_NAME)?.value === "1")
    return { userId: "dev_local", displayName: "Dev Local", email: "dev@local.test", fullName: "Dev Local", role: "member", isStaff: false, isAdmin: false };
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const row = await database()
      .prepare(
        "SELECT u.id,u.email,u.name,COALESCE(m.role,'member') AS role FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN member_accounts m ON m.owner_id=u.id WHERE s.token_hash=? AND s.expires_at>?",
      )
      .bind(sha256(token), new Date().toISOString())
      .first<{ id: string; email: string; name: string; role: string }>();
    if (!row) return null;
    return {
      userId: row.id,
      displayName: row.name,
      email: row.email,
      fullName: row.name,
      role: row.role,
      isStaff: STAFF_ROLES.includes(row.role),
      isAdmin: row.role === "admin",
    };
  } catch {
    return null;
  }
});

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/entrar")) return "/";
  return value;
}
