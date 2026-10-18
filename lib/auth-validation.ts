import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(200);

export const activateSchema = z
  .object({
    codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/),
    email,
    terms: z.literal(true),
  })
  .strict();
export const loginSchema = z.object({ email, senha: z.string().min(1).max(200) }).strict();

export const inviteRegistrationSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    name: z.string().trim().min(2).max(100),
    password: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
    consent: z.literal(true),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const forgotSchema = z.object({ email }).strict();

export const resetSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    password: z.string().min(8).max(200),
    confirmPassword: z.string().min(8).max(200),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, { message: "As senhas não conferem.", path: ["confirmPassword"] });
