import { z } from "zod";
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const projectSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("project"),
      id: z.string().uuid(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z][a-z0-9-]{2,59}$/),
      title: text(5, 180),
      kind: z.enum([
        "Pesquisa",
        "Livro",
        "Tecnologia",
        "Impacto social",
        "Produção cultural",
        "Expansão da NEW",
      ]),
      area: text(2, 80),
      problem: text(30, 3000),
      justification: text(30, 3000),
      expectedResult: text(20, 2000),
      stage: z.enum([
        "Ideia",
        "Planejamento",
        "Em execução",
        "Prestação de contas",
        "Concluído",
      ]),
      goalCents: z.number().int().min(100).max(100_000_000),
      budget: text(20, 4000),
      timeline: text(20, 3000),
      team: text(2, 2000),
      risks: text(20, 3000),
      status: z.enum(["draft", "published"]),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal("update"),
      projectId: z.string().uuid(),
      title: text(5, 140),
      body: text(30, 6000),
      consent: z.literal(true),
    })
    .strict(),
  z
    .object({
      action: z.literal("round"),
      projectId: z.string().uuid(),
      id: z.string().uuid(),
      roundNumber: z.number().int().min(1).max(20),
      title: text(5, 140),
      fundingModel: z.enum(["all_or_nothing", "flexible"]),
      minimumCents: z.number().int().min(100).max(100_000_000),
      targetCents: z.number().int().min(100).max(100_000_000),
      maximumCents: z.number().int().min(100).max(100_000_000),
      purpose: text(20, 2000),
      deliverables: text(20, 3000),
      status: z.enum(["draft", "ready"]),
      consent: z.literal(true),
    })
    .strict(),
]);
