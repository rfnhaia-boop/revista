"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type Submission = {
  id: string;
  kind: string;
  title: string;
  area: string;
  author: string;
  summary: string;
  methodology: string;
  references: string;
  budgetCents: number;
  status: string;
  reviewNote?: string;
  createdAt: string;
};
export type FormKind = "book" | "article" | "project" | "application" | "new-project";
type LoadState = "idle" | "auth" | "loading" | "ready" | "error";

const AREAS = ["Psicologia", "Tecnologia", "Educação", "Sociedade", "Filosofia", "Negócios"];
export const kindLabel: Record<string, string> = {
  book: "Livro",
  "new-project": "Projeto NEW",
  article: "Artigo / ensaio",
  question: "Pergunta",
  application: "Candidatura",
  project: "Pesquisa",
};
export const statusLabel: Record<string, string> = {
  received: "Recebido",
  reviewing: "Em análise",
  changes_requested: "Ajustes solicitados",
  accepted: "Aceito",
  rejected: "Não aceito",
};
const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Ctx = {
  signedIn: boolean;
  items: Submission[];
  state: LoadState;
  open: (kind: FormKind) => void;
  reload: () => Promise<void>;
  ensureLoaded: () => void;
  select: (s: Submission) => void;
};
const SubmissionsContext = createContext<Ctx | null>(null);

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error("useSubmissions precisa do SubmissionsProvider");
  return ctx;
}

export function AuthGate({ returnTo }: { returnTo?: string }) {
  const path = usePathname();
  return (
    <div className="empty">
      <Lock size={32} />
      <h3>Entre para acessar sua área</h3>
      <p>Seus envios ficam vinculados à sua conta e visíveis apenas para você e para a equipe editorial.</p>
      <Link className="primary" href={`/entrar?return_to=${encodeURIComponent(returnTo ?? path)}`}>
        Entrar na NEW
      </Link>
    </div>
  );
}

export function SubmissionsProvider({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [items, setItems] = useState<Submission[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [form, setForm] = useState<FormKind | null>(null);
  const [record, setRecord] = useState<Submission | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [consent, setConsent] = useState(false);
  const [requestId, setRequestId] = useState("");
  const requested = useRef(false);

  const reload = useCallback(async () => {
    if (!signedIn) {
      setState("auth");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
      const data = (await res.json()) as { error?: string; items: Submission[] };
      if (!res.ok) throw new Error(data.error);
      setItems(data.items);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [signedIn]);

  const ensureLoaded = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    void reload();
  }, [reload]);

  const open = useCallback((kind: FormKind) => {
    setFormError("");
    setConsent(false);
    setRequestId(crypto.randomUUID());
    setForm(kind);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          kind: form,
          title: String(fd.get("title")),
          author: String(fd.get("author")),
          area: String(fd.get("area")),
          summary: String(fd.get("summary")),
          methodology: String(fd.get("methodology")),
          references: String(fd.get("references") || ""),
          budgetCents: Math.round(Number(fd.get("budget") || 0) * 100),
          consent,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setForm(null);
      toast.success("Envio recebido. Você acompanha o andamento na Área do pesquisador.");
      requested.current = true;
      void reload();
      router.push("/pesquisador");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      setSaving(false);
    }
  }

  const title =
    form === "book" ? "Submeter livro"
    : form === "new-project" ? "Cadastrar projeto da NEW"
    : form === "article" ? "Enviar artigo ou ensaio"
    : form === "project" ? "Apresentar projeto"
    : "Apresentar candidatura";

  return (
    <SubmissionsContext.Provider value={{ signedIn, items, state, open, reload, ensureLoaded, select: setRecord }}>
      {children}

      <Dialog open={!!form} onOpenChange={(v) => { if (!v && !saving) setForm(null); }}>
        <DialogContent className="submission-dialog">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>O envio é privado e não implica publicação, aprovação ou financiamento.</DialogDescription>
          {!signedIn ? (
            <AuthGate />
          ) : (
            <form onSubmit={submit} className="submission-form">
              <div className="two-grid">
                <label className="field">
                  Título
                  <input name="title" minLength={8} maxLength={180} required placeholder="Nome do seu trabalho" />
                </label>
                <label className="field">
                  Autoria
                  <input name="author" minLength={2} maxLength={120} required placeholder="Nome de quem propõe" />
                </label>
              </div>
              <label className="field">
                Área
                <Select name="area" defaultValue="Psicologia">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="field">
                {form === "book" ? "Sinopse e proposta da obra" : "Resumo e objetivo"}
                <textarea name="summary" minLength={60} maxLength={12000} rows={4} required placeholder="Explique o problema, por que ele importa e o que pretende investigar. Mínimo de 60 caracteres." />
              </label>
              <label className="field">
                {form === "application" ? "Experiência e proposta metodológica" : form === "book" ? "Estrutura, capítulos e estágio do manuscrito" : "Método e etapas previstas"}
                <textarea name="methodology" minLength={30} maxLength={12000} rows={3} required placeholder="Descreva o caminho da investigação, limites e entregas. Mínimo de 30 caracteres." />
              </label>
              <div className="two-grid">
                <label className="field">
                  Referências ou formação
                  <textarea name="references" rows={2} maxLength={8000} placeholder="Fontes, currículo ou formação relevante" />
                </label>
                <label className="field">
                  Orçamento estimado (R$)
                  <input name="budget" type="number" min="0" max="1000000" step="0.01" defaultValue={0} />
                  <span className="fine">Informativo; não gera cobrança.</span>
                </label>
              </div>
              <div className="notice">
                Não inclua dados de participantes, informações médicas ou documentos pessoais. Manuscritos e vídeos serão recebidos em uma etapa posterior.
              </div>
              <label className="consent">
                <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
                Declaro que posso submeter este conteúdo e autorizo seu armazenamento para avaliação. Não autorizo publicação automática.
              </label>
              {formError && <p className="error" role="alert">{formError}</p>}
              <button className="primary full" disabled={saving || !consent}>
                {saving ? "Confirmando envio…" : "Enviar para recebimento"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!record} onOpenChange={(v) => !v && setRecord(null)}>
        <DialogContent className="reading-dialog">
          <DialogTitle>{record?.title}</DialogTitle>
          <DialogDescription>
            {record ? statusLabel[record.status] ?? record.status : ""} · Registro privado · {record?.id}
          </DialogDescription>
          {record && (
            <div className="reading">
              <p>
                <strong>Autoria:</strong> {record.author} · {record.area} · {kindLabel[record.kind] ?? "Envio"}
              </p>
              <h3>Resumo</h3>
              <p className="user-text">{record.summary}</p>
              <h3>Método proposto</h3>
              <p className="user-text">{record.methodology}</p>
              <h3>Referências</h3>
              <p className="user-text">{record.references || "Não informadas"}</p>
              {record.budgetCents > 0 && <p>Orçamento estimado: {money(record.budgetCents)}</p>}
              {record.reviewNote && (
                <div className="notice"><strong>Nota da equipe:</strong> {record.reviewNote}</div>
              )}
              <div className="notice">
                {record.status === "received"
                  ? "Recebimento confirmado. Nenhum parecer ou publicação foi aprovado."
                  : "A decisão sobre este envio não emite selo nem publica automaticamente."}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SubmissionsContext.Provider>
  );
}

export function OpenFormButton({ kind, className, children }: { kind: FormKind; className?: string; children: React.ReactNode }) {
  const { open } = useSubmissions();
  return (
    <button className={className} onClick={() => open(kind)}>
      {children}
    </button>
  );
}

export function SubmissionTable({ items }: { items: Submission[] }) {
  const { select } = useSubmissions();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trabalho</TableHead>
          <TableHead>Formato</TableHead>
          <TableHead>Área</TableHead>
          <TableHead>Recebido em</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="table-title">{r.title}</TableCell>
            <TableCell>{kindLabel[r.kind] ?? "Pesquisa"}</TableCell>
            <TableCell>{r.area}</TableCell>
            <TableCell>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</TableCell>
            <TableCell><span className="type-label">{statusLabel[r.status] ?? r.status}</span></TableCell>
            <TableCell>
              <button className="textbutton" onClick={() => select(r)}>
                Abrir <ChevronRight size={14} />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Lista do usuário (com estados de carregamento/erro/vazio). */
export function SubmissionsList({
  kind,
  loadingText,
  empty,
}: {
  kind?: string;
  loadingText: string;
  empty: React.ReactNode;
}) {
  const { items, state, reload, ensureLoaded } = useSubmissions();
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);
  const shown = kind ? items.filter((i) => i.kind === kind) : items;
  if (state === "auth") return <AuthGate />;
  if (state === "idle" || state === "loading") return <p role="status">{loadingText}</p>;
  if (state === "error")
    return (
      <div className="empty">
        <p>Não foi possível carregar. Tente novamente.</p>
        <button className="outline" onClick={() => void reload()}>Tentar novamente</button>
      </div>
    );
  return shown.length ? <SubmissionTable items={shown} /> : <>{empty}</>;
}
