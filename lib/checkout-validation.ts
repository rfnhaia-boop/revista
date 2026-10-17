import { z } from "zod";
import { isCpfCnpj } from "./payout-validation.ts";

const cpfCnpj = z.string().transform((v) => v.replace(/\D/g, "")).refine(isCpfCnpj, "CPF ou CNPJ inválido.");

/** O preço nunca vem do navegador: só dizemos o que comprar. */
export const checkoutSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("single"), notebookId: z.string().uuid(), cpfCnpj, consent: z.literal(true) }).strict(),
  z.object({ type: z.literal("subscription"), planId: z.string().uuid(), cpfCnpj, consent: z.literal(true) }).strict(),
]);

export const cancelSchema = z.object({ id: z.string().uuid() }).strict();

/** Comissão da plataforma em %, vinda do ambiente, limitada a 0–50. */
export function commissionPercent(raw: string | undefined) {
  const n = Number(raw ?? "10");
  return Number.isFinite(n) ? Math.min(50, Math.max(0, n)) : 10;
}

/** Quanto do valor fica com a plataforma (centavos) e qual % vai ao criador no split. */
export function splitOf(cents: number, percent: number) {
  return { commissionCents: Math.round((cents * percent) / 100), creatorPercent: 100 - percent };
}
