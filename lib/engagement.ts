import { createHash } from "node:crypto";
import { z } from "zod";

// "Dia" no fuso de Brasília, para o gráfico e para contar 1 leitura por leitor/dia.
export const brDay = (d = new Date()) => new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);

const salt = () => process.env.APP_ORIGIN || "revista";
/** Chave anônima do leitor: nunca guarda IP, e-mail ou id em claro. */
export function viewerKey(userId: string | null, ip: string, ua: string) {
  const raw = userId ? `u:${userId}` : `a:${ip}|${ua.slice(0, 120)}`;
  return createHash("sha256").update(`${salt()}|${raw}`).digest("hex").slice(0, 32);
}

const id = z.string().uuid();
export const engageSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("view"), postId: id }).strict(),
  z.object({ action: z.literal("react"), postId: id, enabled: z.boolean() }).strict(),
  z.object({ action: z.literal("reply"), postId: id, body: z.string() }).strict(),
  z.object({ action: z.literal("hide-reply"), replyId: id, hidden: z.boolean() }).strict(),
  z.object({ action: z.literal("mark-seen"), postId: id }).strict(),
  z.object({ action: z.literal("mark-seen-all") }).strict(),
]);

export const REPLY_MIN = 2;
export const REPLY_MAX = 1000;
/** Resposta é texto puro: normaliza espaços/quebras e limita o tamanho. */
export function cleanReply(raw: string) {
  const t = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f​-‏‪-‮]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (t.length < REPLY_MIN) return { error: "Escreva pelo menos algumas palavras." } as const;
  if (t.length > REPLY_MAX) return { error: `A resposta pode ter até ${REPLY_MAX} caracteres.` } as const;
  return { text: t } as const;
}

export type ReplyItem = {
  id: string;
  authorName: string;
  body: string;
  status: "visible" | "hidden";
  createdAt: string;
  isMine: boolean;
  isNew: boolean;
};
export type Conversation = { likes: number; likedByMe: boolean; replies: ReplyItem[] };
export type Totals = { readers: number; views: number; replies: number; likes: number };
export const PERIODS = [7, 30, 90] as const;
export type Insights = {
  period: number;
  prev: Totals;
  days: { day: string; views: number }[];
  readers: number;
  views: number;
  replies: number;
  likes: number;
  newReplies: number;
  top: { id: string; title: string; readers: number; replies: number; likes: number }[];
};
export type PostStats = { days: { day: string; views: number }[]; readers: number; views: number; replies: number; likes: number };
export type InboxItem = {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  body: string;
  status: "visible" | "hidden";
  createdAt: string;
  fromMe: boolean;
  isNew: boolean;
};

/** Variação em relação ao período anterior, pronta para exibir. */
export function delta(cur: number, prev: number): { text: string; tone: "up" | "down" | "flat" | "new" } {
  if (prev === 0) return cur > 0 ? { text: "novo", tone: "new" } : { text: "–", tone: "flat" };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { text: "igual", tone: "flat" };
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, tone: pct > 0 ? "up" : "down" };
}
