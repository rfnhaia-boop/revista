import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(200);

export const activateSchema = z
  .object({
    codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/),
    email,
  })
  .strict();
export const loginSchema = z.object({ email, senha: z.string().min(1).max(200) }).strict();
