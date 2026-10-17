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
  const res = await fetch(`${BASES[asaasEnv()]}${path}`, {
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
