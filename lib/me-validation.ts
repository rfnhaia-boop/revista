import { z } from "zod";
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const meSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("role-request"),
      requestedRole: z.enum(["creator", "researcher"]),
      presentation: text(30, 2000),
      experience: text(30, 3000),
      portfolio: z.union([
        z.literal(""),
        z
          .string()
          .url()
          .max(400)
          .refine((v) => new URL(v).protocol === "https:"),
      ]),
      motivation: text(30, 2000),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal("question"),
      title: text(10, 220),
      context: text(30, 3000),
      importance: text(30, 2000),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal("accept-invite"),
      token: text(20, 300),
      consent: z.literal(true),
    })
    .strict(),
]);
