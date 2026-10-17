import { moneyEnabled } from "@/lib/features";

const BASES = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
} as const;

export type AsaasEnv = keyof typeof BASES;

/** Sandbox por padrão. Produção só com ASAAS_ENV=production *e* FEATURE_MONEY=1. */
export function asaasEnv(): AsaasEnv {
  return process.env.ASAAS_ENV === "production" && moneyEnabled() ? "production" : "sandbox";
}

export class AsaasError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Chamada servidor-a-servidor. A chave nunca vai ao navegador nem aos logs. */
export async function asaasRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new AsaasError(503, "Provedor de pagamento não configurado.");
  const base = asaasEnv() === "sandbox" && process.env.ASAAS_BASE_URL ? process.env.ASAAS_BASE_URL : BASES[asaasEnv()];
  const res = await fetch(`${base}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", access_token: key, "User-Agent": "revista-new" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { errors?: { description?: string }[] };
  if (!res.ok) throw new AsaasError(res.status, data.errors?.[0]?.description ?? "Falha no provedor de pagamento.");
  return data as T;
}

export type AsaasSubaccount = { id: string; walletId: string };

/** Abre a subconta do criador. A apiKey que o Asaas devolve é descartada de propósito. */
export async function createSubaccount(input: {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string;
  mobilePhone: string;
  incomeValue: number;
  postalCode: string;
  address: string;
  addressNumber: string;
  province: string;
}): Promise<AsaasSubaccount> {
  const r = await asaasRequest<{ id: string; walletId: string }>("/accounts", { method: "POST", body: input });
  return { id: r.id, walletId: r.walletId };
}
