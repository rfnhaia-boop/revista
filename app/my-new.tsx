"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  CircleUserRound,
  FileQuestion,
  FlaskConical,
  FolderKanban,
  Heart,
  KeyRound,
  LayoutDashboard,
  PenLine,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import MyNewOverview from "./my-new-overview";

type Role = "member" | "creator" | "researcher" | "editorial" | "admin";
type Data = {
  role: Role;
  name: string;
  counts: { saved: number; following: number; notes: number; projects: number };
  requests: {
    id: string;
    requestedRole: string;
    status: string;
    reviewNote: string;
    createdAt: string;
  }[];
  questions: {
    id: string;
    title: string;
    status: string;
    reviewNote: string;
    createdAt: string;
  }[];
};
const roleName: Record<Role, string> = {
  member: "Membro",
  creator: "Criador",
  researcher: "Pesquisador",
  editorial: "Editorial",
  admin: "Administrador",
};
const statusName: Record<string, string> = {
  submitted: "Recebida",
  reviewing: "Em análise",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovada",
  rejected: "Não aprovada",
  published: "Publicada",
  selected: "Selecionada",
};
const actionNames: Record<string, string> = {
  overview: "Visão geral",
  profile: "Meu perfil",
  notebook: "Meu Caderno",
  saved: "Salvos",
  following: "Seguindo",
  support: "Apoios e compras",
  question: "Enviar pergunta",
  access: "Tornar-me criador",
  invite: "Usar convite",
  projects: "Meus projetos",
  research: "Pesquisa e ciência",
  publishing: "Publicações",
  analytics: "Resultados",
  settings: "Configurações",
};
async function send(payload: unknown) {
  const r = await fetch("/api/me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = (await r.json()) as { error?: string };
  if (!r.ok) throw new Error(j.error || "Não foi possível confirmar.");
  return j;
}
export default function MyNew({ signedIn, money }: { signedIn: boolean; money: boolean }) {
  const router = useRouter();
  const onNavigate = (section: string) => router.push("/" + section);
  const [data, setData] = useState<Data | null>(null),
    [active, setActive] = useState("overview"),
    [loading, setLoading] = useState(signedIn),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [consent, setConsent] = useState(false);
  async function load() {
    await Promise.resolve();
    setLoading(true);
    try {
      const r = await fetch("/api/me");
      const j = (await r.json()) as Data & { error?: string };
      if (!r.ok) throw new Error(j.error);
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!signedIn) return;
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
     
  }, [signedIn]);
  if (!signedIn)
    return (
      <section className="my-new-auth glass">
        <CircleUserRound />
        <div>
          <div className="eyebrow">MINHA NEW</div>
          <h1>Sua área pessoal começa com uma conta.</h1>
          <p>
            Entre para guardar leituras, criar seu Caderno, acompanhar apoios e
            solicitar acesso de criador.
          </p>
          <Link className="primary" href="/entrar?return_to=%2Fminha-new">
            Entrar na NEW
          </Link>
        </div>
      </section>
    );
  if (loading)
    return (
      <p role="status" className="community-loading">
        Preparando sua área…
      </p>
    );
  if (error || !data)
    return (
      <div className="glass empty">
        <p>{error}</p>
        <button className="outline" onClick={() => void load()}>
          Tentar novamente
        </button>
      </div>
    );
  const advanced = ["creator", "researcher", "editorial", "admin"].includes(
    data.role,
  );
  const nav = [
    ["overview", LayoutDashboard],
    ["profile", CircleUserRound],
    ["notebook", PenLine],
    ["saved", Bookmark],
    ["following", Users],
    ["support", Heart],
    ["question", FileQuestion],
    ...((advanced
      ? [
          ["publishing", BookOpen],
          ["projects", FolderKanban],
          ["research", FlaskConical],
          ["analytics", ShieldCheck],
        ]
      : []) as [string, typeof LayoutDashboard][]),
    ["access", ShieldCheck],
    ["invite", KeyRound],
    ["settings", Settings],
  ].filter(([id]) => money || id !== "support") as [string, typeof LayoutDashboard][];
  const route: Record<string, string> = {
    profile: "caderno",
    notebook: "caderno",
    saved: "explorar",
    following: "pessoas",
    support: "apoiador",
    publishing: "caderno",
    projects: "projetos",
    research: "research",
  };
  async function submitRole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await send({
        action: "role-request",
        requestedRole: String(f.get("requestedRole")),
        presentation: String(f.get("presentation")),
        experience: String(f.get("experience")),
        portfolio: String(f.get("portfolio")),
        motivation: String(f.get("motivation")),
        consent,
      });
      toast.success("Solicitação enviada para análise.");
      setConsent(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setSaving(false);
    }
  }
  async function submitQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await send({
        action: "question",
        title: String(f.get("title")),
        context: String(f.get("context")),
        importance: String(f.get("importance")),
        consent,
      });
      toast.success("Pergunta recebida na triagem privada.");
      setConsent(false);
      (e.currentTarget as HTMLFormElement).reset();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setSaving(false);
    }
  }
  async function acceptInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await send({
        action: "accept-invite",
        token: String(f.get("token")),
        consent,
      });
      toast.success("Convite confirmado.");
      setConsent(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Convite inválido.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="my-new-wrap">
      <div className="my-new-hero">
        <div>
          <div className="eyebrow">CENTRAL PESSOAL</div>
          <h1>Minha NEW</h1>
          <p>
            Olá, {data.name}. Aqui estão suas leituras, ideias, acessos e
            projetos.
          </p>
        </div>
        <span className="role-badge">
          <ShieldCheck size={15} />
          {roleName[data.role]}
        </span>
      </div>
      <div className="my-new-shell">
        <aside className="glass my-new-sidebar">
          <div className="my-new-person">
            <span>{data.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{data.name}</strong>
              <small>{roleName[data.role]}</small>
            </div>
          </div>
          <nav aria-label="Navegação da área pessoal">
            {nav.map(([id, Icon]) => (
              <button
                key={id}
                className={active === id ? "active" : ""}
                onClick={() =>
                  route[id] ? onNavigate(route[id]) : setActive(id)
                }
              >
                <Icon size={17} />
                <span>{actionNames[id]}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </nav>
        </aside>
        <div className="my-new-content">
          {active === "overview" && (
            <MyNewOverview
              name={data.name}
              advanced={advanced}
              projects={data.counts.projects}
              requests={data.requests}
              onNavigate={onNavigate}
              onSection={setActive}
            />
          )}
          {active === "access" && (
            <div className="glass my-new-form">
              <div className="eyebrow">ACESSO PROFISSIONAL</div>
              <h2>Solicitar análise de perfil</h2>
              <p>
                Todo membro publica pensamentos e envia artigos para revisão. O perfil de criador libera a apresentação de projetos; o de pesquisador exige perfil de criador já aprovado.
              </p>
              {data.requests.map((r) => (
                <div className="request-line" key={r.id}>
                  <span>
                    {roleName[r.requestedRole as Role] || r.requestedRole}
                  </span>
                  <strong>{statusName[r.status] || r.status}</strong>
                  <small>
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </small>
                </div>
              ))}
              <form className="submission-form" onSubmit={submitRole}>
                <label className="field">
                  Perfil solicitado
                  <Select
                    name="requestedRole"
                    defaultValue={
                      data.role === "creator" ? "researcher" : "creator"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.role === "creator" && (
                        <SelectItem value="researcher">Pesquisador</SelectItem>
                      )}
                      {data.role === "member" && (
                        <SelectItem value="creator">Criador</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </label>
                <label className="field">
                  Apresentação
                  <textarea
                    name="presentation"
                    minLength={30}
                    maxLength={2000}
                    required
                    rows={4}
                  />
                </label>
                <label className="field">
                  Experiência e temas
                  <textarea
                    name="experience"
                    minLength={30}
                    maxLength={3000}
                    required
                    rows={4}
                  />
                </label>
                <label className="field">
                  Portfólio público
                  <input
                    name="portfolio"
                    type="url"
                    required
                    placeholder="https://"
                  />
                </label>
                <label className="field">
                  Por que quer produzir na NEW?
                  <textarea
                    name="motivation"
                    minLength={30}
                    maxLength={2000}
                    required
                    rows={4}
                  />
                </label>
                <label className="consent">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                  />
                  Confirmo que as informações são verdadeiras e autorizo sua
                  análise.
                </label>
                <button className="primary" disabled={!consent || saving}>
                  Enviar solicitação
                </button>
              </form>
            </div>
          )}
          {active === "question" && (
            <div className="glass my-new-form">
              <div className="eyebrow">PERGUNTAS DA COMUNIDADE</div>
              <h2>Uma pergunta primeiro entra em triagem.</h2>
              <p>
                Ela não fica pública automaticamente. A equipe verifica clareza,
                relevância, segurança e possibilidade de investigação; depois
                pode publicar, selecionar ou abrir uma chamada.
              </p>
              <form className="submission-form" onSubmit={submitQuestion}>
                <label className="field">
                  Pergunta
                  <input name="title" required minLength={10} maxLength={220} />
                </label>
                <label className="field">
                  Contexto
                  <textarea
                    name="context"
                    required
                    minLength={30}
                    maxLength={3000}
                    rows={5}
                  />
                </label>
                <label className="field">
                  Por que isso importa?
                  <textarea
                    name="importance"
                    required
                    minLength={30}
                    maxLength={2000}
                    rows={4}
                  />
                </label>
                <label className="consent">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                  />
                  Autorizo a análise editorial e, se aprovada, a publicação da
                  pergunta.
                </label>
                <button className="primary" disabled={!consent || saving}>
                  Enviar para triagem
                </button>
              </form>
              {data.questions.length > 0 && (
                <div className="request-history">
                  <h3>Minhas perguntas</h3>
                  {data.questions.map((q) => (
                    <div className="request-line" key={q.id}>
                      <span>{q.title}</span>
                      <strong>{statusName[q.status] || q.status}</strong>
                      <small>
                        {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {active === "invite" && (
            <div className="glass my-new-form">
              <div className="eyebrow">CONVITE NEW</div>
              <h2>Ativar um convite</h2>
              <p>
                Convites são individuais, têm validade e só funcionam na conta
                indicada.
              </p>
              <form className="submission-form" onSubmit={acceptInvite}>
                <label className="field">
                  Código do convite
                  <input
                    name="token"
                    minLength={20}
                    maxLength={200}
                    required
                    autoComplete="off"
                  />
                </label>
                <label className="consent">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                  />
                  Confirmo que este convite foi emitido para mim.
                </label>
                <button className="primary" disabled={!consent || saving}>
                  Ativar acesso
                </button>
              </form>
            </div>
          )}
          {["analytics", "settings"].includes(active) && (
            <div className="glass empty">
              <Settings />
              <h2>{actionNames[active]}</h2>
              <p>
                Esta área já está reservada na arquitetura e será ativada quando
                houver dados reais e controles administrativos auditáveis.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
