import { z } from "zod";

const digits = (v: string) => v.replace(/\D/g, "");

function cpfValid(v: string) {
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false;
  for (const n of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(v[i]) * (n + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(v[n])) return false;
  }
  return true;
}

function cnpjValid(v: string) {
  if (v.length !== 14 || /^(\d)\1+$/.test(v)) return false;
  for (const n of [12, 13]) {
    let sum = 0,
      weight = n - 7;
    for (let i = 0; i < n; i++) {
      sum += Number(v[i]) * weight--;
      if (weight < 2) weight = 9;
    }
    const check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (check !== Number(v[n])) return false;
  }
  return true;
}

export const isCpfCnpj = (v: string) => cpfValid(v) || cnpjValid(v);

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Dados para abrir a subconta do criador no provedor. Não são guardados aqui, só enviados. */
export const payoutSchema = z
  .object({
    name: text(3, 120),
    cpfCnpj: z.string().transform(digits).refine(isCpfCnpj, "CPF ou CNPJ inválido."),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida.").optional(),
    mobilePhone: z.string().transform(digits).refine((v) => v.length === 10 || v.length === 11, "Celular inválido."),
    incomeValue: z.number().min(0).max(10_000_000),
    postalCode: z.string().transform(digits).refine((v) => v.length === 8, "CEP inválido."),
    address: text(3, 150),
    addressNumber: text(1, 20),
    province: text(2, 80),
    consent: z.literal(true),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.cpfCnpj.length === 11) {
      const born = v.birthDate ? Date.parse(v.birthDate) : NaN;
      if (!Number.isFinite(born)) ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Informe a data de nascimento." });
      else if (Date.now() - born < 18 * 365.25 * 86400000) ctx.addIssue({ code: "custom", path: ["birthDate"], message: "É preciso ter 18 anos ou mais." });
    }
  });

export const MIN_PLAN_CENTS = 500;
export const MAX_PLAN_CENTS = 100_000;

export const planSchema = z
  .object({
    name: text(3, 60),
    priceCents: z.number().int().min(MIN_PLAN_CENTS).max(MAX_PLAN_CENTS),
  })
  .strict();

export const planToggleSchema = z.object({ id: z.string().uuid(), active: z.boolean() }).strict();
