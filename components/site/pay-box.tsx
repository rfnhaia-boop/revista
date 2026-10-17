"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Lock } from "lucide-react";
import { toast } from "sonner";

type Plan = { id: string; name: string; priceCents: number };
type Qr = { encodedImage: string; payload: string };
type Props = { notebookId: string; priceCents: number; creatorName: string; plans: Plan[]; excerpt: string; signedIn: boolean; loginHref: string };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PayBox({ notebookId, priceCents, creatorName, plans, excerpt, signedIn, loginHref }: Props) {
  const router = useRouter();
  const [choice, setChoice] = useState<string>("single");
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<{ id: string; qr: Qr | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (!pay) return;
    timer.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/checkout?id=${pay.id}`, { cache: "no-store" });
        const d = (await r.json()) as { status?: string };
        if (d.status === "paid") {
          stop();
          toast.success("Pagamento confirmado! Liberando o texto…");
          router.refresh();
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }, 4000);
    return stop;
  }, [pay, router, stop]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const base = { cpfCnpj: String(f.get("cpfCnpj") ?? ""), consent: f.get("consent") === "on" };
    const body = choice === "single" ? { type: "single", notebookId, ...base } : { type: "subscription", planId: choice, ...base };
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = (await r.json().catch(() => ({}))) as { error?: string; paymentId?: string; qr?: Qr | null };
      if (!r.ok || !d.paymentId) throw new Error(d.error || "Não foi possível gerar o pagamento.");
      setPay({ id: d.paymentId, qr: d.qr ?? null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o pagamento.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  }

  return (
    <div className="paid-lock glass pay-box">
      <Lock size={22} />
      <h3>Conteúdo para quem apoia {creatorName}</h3>
      <p>{excerpt}</p>
      {!signedIn ? (
        <Link className="primary" href={loginHref}>Entrar para desbloquear</Link>
      ) : pay ? (
        <div className="pay-pix" role="status">
          <p><strong>Pague com Pix</strong> — o texto libera sozinho assim que o pagamento for confirmado.</p>
          {pay.qr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pay-qr" alt="QR Code do Pix" src={`data:image/png;base64,${pay.qr.encodedImage}`} width={200} height={200} />
              <code className="pay-code">{pay.qr.payload}</code>
              <button className="outline small" onClick={() => copy(pay.qr!.payload)}>{copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar código Pix</>}</button>
            </>
          ) : (
            <p className="fine">O QR Code ainda está sendo gerado. Aguarde alguns segundos ou recarregue a página.</p>
          )}
          <p className="fine">Aguardando pagamento…</p>
        </div>
      ) : (
        <form className="pay-form" onSubmit={submit}>
          <fieldset>
            <legend>Como você quer acessar?</legend>
            <label className="pay-opt"><input type="radio" name="choice" checked={choice === "single"} onChange={() => setChoice("single")} /><span>Só este texto <b>{brl(priceCents)}</b></span></label>
            {plans.map((p) => (
              <label key={p.id} className="pay-opt"><input type="radio" name="choice" checked={choice === p.id} onChange={() => setChoice(p.id)} /><span>Assinar: {p.name} <b>{brl(p.priceCents)}/mês</b><small>Todos os textos pagos de {creatorName}. Você paga por Pix a cada mês e cancela quando quiser.</small></span></label>
            ))}
          </fieldset>
          <label className="pay-field">CPF ou CNPJ (exigido para emitir o Pix)<input name="cpfCnpj" required inputMode="numeric" autoComplete="off" /></label>
          <label className="pay-check"><input name="consent" type="checkbox" required /><span>Autorizo enviar meu CPF/CNPJ ao provedor de pagamento para emitir o Pix.</span></label>
          <button className="primary" disabled={busy}>{busy ? "Gerando Pix…" : "Gerar Pix"}</button>
        </form>
      )}
    </div>
  );
}
