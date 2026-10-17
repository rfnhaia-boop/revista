import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const asaasWebhookSchema = z
  .object({
    id: z.string().min(1).max(100),
    event: z.string().min(1).max(80),
    payment: z
      .object({ id: z.string().min(1).max(100), status: z.string().max(60).optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();
export type AsaasWebhook = z.infer<typeof asaasWebhookSchema>;

export type PaymentEffect = "paid" | "refunded" | "overdue" | "ignore";

/** Traduz o evento do Asaas no que o nosso sistema faz. Qualquer evento desconhecido é ignorado. */
export function effectOf(event: string): PaymentEffect {
  switch (event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return "paid";
    case "PAYMENT_REFUNDED":
    case "PAYMENT_CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_DISPUTE":
    case "PAYMENT_AWAITING_CHARGEBACK_REVERSAL":
      return "refunded";
    case "PAYMENT_OVERDUE":
      return "overdue";
    default:
      return "ignore";
  }
}

export function tokenMatches(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const SUBSCRIPTION_GRACE_DAYS = 32;

