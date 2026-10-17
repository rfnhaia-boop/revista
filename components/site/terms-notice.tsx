"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LEGAL_VERSION } from "@/lib/legal";

/** Aviso para quem ainda não aceitou a versão vigente dos Termos e da Política de Privacidade. */
export default function TermsNotice() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function accept() {
    setBusy(true);
    try {
      const r = await fetch("/api/me/terms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: LEGAL_VERSION, accept: true }) });
      if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error || "Não foi possível registrar o aceite.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar o aceite.");
      setBusy(false);
    }
  }
  return (
    <div className="terms-notice" role="region" aria-label="Atualização dos Termos">
      <p>
        Atualizamos os <Link href="/termos" target="_blank">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank">Política de Privacidade</Link>. Para continuar usando a plataforma, confirme que leu e aceita.
      </p>
      <button className="primary small" onClick={accept} disabled={busy}>{busy ? "Registrando…" : "Li e aceito"}</button>
    </div>
  );
}
