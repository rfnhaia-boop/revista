/**
 * Versão vigente dos Termos de Uso e da Política de Privacidade (uma só, as duas mudam juntas).
 * Ao publicar texto novo, troque a versão: todo mundo vê o aviso e precisa aceitar de novo.
 */
export const LEGAL_VERSION = "2026-10-17";

/** Enquanto o parecer jurídico não sai, as páginas mostram que o texto é uma minuta. Desligar: LEGAL_DRAFT=0. */
export const legalDraft = () => process.env.LEGAL_DRAFT !== "0";

const fromEnv = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

/** Dados da empresa nos textos. Preencher no ambiente antes de publicar. */
export function company() {
  return {
    name: fromEnv("LEGAL_COMPANY_NAME", "NEW Company [razão social a preencher]"),
    cnpj: fromEnv("LEGAL_COMPANY_CNPJ", "[CNPJ a preencher]"),
    address: fromEnv("LEGAL_COMPANY_ADDRESS", "[endereço a preencher]"),
    contactEmail: fromEnv("LEGAL_CONTACT_EMAIL", "[e-mail de contato a preencher]"),
    privacyEmail: fromEnv("LEGAL_PRIVACY_EMAIL", "[e-mail do encarregado de dados a preencher]"),
    forum: fromEnv("LEGAL_FORUM", "[comarca a preencher]"),
  };
}

export const COMMISSION_NOTE = "A plataforma retém uma comissão sobre cada venda, informada ao criador antes de ele começar a vender.";
