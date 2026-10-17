import { LEGAL_VERSION } from "@/lib/legal";
import { database } from "@/lib/storage";

export type AcceptanceSource = "activation" | "invite" | "notice";

/** Guarda quem aceitou, qual versão, quando e por onde. Nenhum dado além disso (sem IP). */
export function acceptanceStatement(ownerId: string, source: AcceptanceSource, now = new Date().toISOString()) {
  return database()
    .prepare("INSERT INTO terms_acceptances (id,owner_id,version,source,accepted_at) VALUES (?,?,?,?,?)")
    .bind(crypto.randomUUID(), ownerId, LEGAL_VERSION, source, now);
}

export async function recordAcceptance(ownerId: string, source: AcceptanceSource) {
  await acceptanceStatement(ownerId, source).run();
}

export async function hasAcceptedCurrent(ownerId: string) {
  const row = await database()
    .prepare("SELECT id FROM terms_acceptances WHERE owner_id=? AND version=? LIMIT 1")
    .bind(ownerId, LEGAL_VERSION)
    .first<{ id: string }>();
  return !!row;
}
