"use client";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  FileText,
  FlaskConical,
  FolderKanban,
  PenLine,
  Plus,
  ShieldCheck,
} from "lucide-react";

type Post = {
  id: string;
  title: string;
  format: string;
  area: string;
  access: "free" | "paid";
  status: "draft" | "published" | "hidden";
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
};
type Profile = { name: string; slug: string; followers: number; postCount: number } | null;
type Request = { id: string; requestedRole: string; status: string };
type MyArticle = { id: string; slug: string; title: string; status: string; reviewNote: string; updatedAt: string };
const articleStatus: Record<string, [string, string]> = {
  draft: ["Rascunho", ""],
  submitted: ["Aguardando revisão", ""],
  reviewing: ["Em revisão", ""],
  changes_requested: ["Ajustes pedidos", ""],
  rejected: ["Não aceito", ""],
  published: ["Publicado", "on"],
};

const dateFmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export default function MyNewOverview({
  name,
  advanced,
  projects,
  requests,
  onNavigate,
  onSection,
}: {
  name: string;
  advanced: boolean;
  projects: number;
  requests: Request[];
  onNavigate: (section: string) => void;
  onSection: (section: string) => void;
}) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [submissions, setSubmissions] = useState(0);
  const [articles, setArticles] = useState<MyArticle[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/community")
      .then((r) => r.json())
      .then((d: { posts?: Post[]; myProfile?: Profile }) => {
        if (!alive) return;
        setPosts((d.posts ?? []).filter((p) => p.isMine));
        setProfile(d.myProfile ?? null);
      })
      .catch(() => alive && setPosts([]));
    fetch("/api/articles")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: MyArticle[] }) => alive && setArticles(d.items ?? []))
      .catch(() => alive && setArticles([]));
    fetch("/api/submissions")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: unknown[] }) => alive && setSubmissions(d.items?.length ?? 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const first = name.split(" ")[0] || "criador";
  const published = (posts ?? []).filter((p) => p.status === "published");
  const drafts = (posts ?? []).filter((p) => p.status === "draft");
  const pending = requests.find((r) => r.requestedRole === "creator" && ["submitted", "reviewing", "changes_requested"].includes(r.status));
  const go = (path: string) => () => {
    window.location.href = path;
  };

  const steps = [
    { done: !!profile, label: "Criar seu perfil público", action: "/caderno", cta: "Criar perfil" },
    { done: (posts ?? []).length > 0, label: "Escrever o primeiro pensamento", action: "/caderno?novo=1", cta: "Escrever" },
    { done: published.length > 0, label: "Publicar um pensamento", action: "/caderno", cta: "Ver rascunhos" },
  ];
  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="eyebrow">{advanced ? "PAINEL DO CRIADOR" : "SUA ÁREA"}</div>
          <h2>{advanced ? "O que você quer publicar hoje?" : `Olá, ${first}. O que você quer escrever?`}</h2>
          <p>Pensamentos são imediatos. Artigos passam pela revisão da equipe antes de entrar na Revista.</p>
        </div>
        <div className="dash-ctas">
          <button className="outline dash-cta" onClick={go("/caderno?novo=1")}>
            <PenLine size={17} /> Escrever pensamento
          </button>
          <button className="primary dash-cta" onClick={go("/escrever")}>
            <Plus size={17} /> Escrever artigo
          </button>
        </div>
      </div>

      {!advanced && (
        <div className="dash-gate glass">
          <ShieldCheck size={26} />
          <div>
            <h3>{pending ? "Seu pedido de perfil de criador está em análise" : "Quer apresentar projetos?"}</h3>
            <p>
              {pending
                ? "Você já pode escrever pensamentos e artigos. Quando o perfil for aprovado, os projetos também serão liberados."
                : "Você já pode publicar pensamentos e enviar artigos. Para apresentar projetos de conhecimento, solicite o perfil de criador."}
            </p>
          </div>
          {!pending && (
            <button className="outline" onClick={() => onSection("access")}>
              Solicitar perfil de criador
            </button>
          )}
        </div>
      )}

      <div className="dash-stats">
        {[
          [published.length, "Publicados"],
          [drafts.length, "Rascunhos"],
          [profile?.followers ?? 0, "Seguidores"],
          [projects, "Projetos"],
        ].map(([n, l]) => (
          <div className="glass" key={String(l)}>
            <strong>{posts === null ? "–" : n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-main">
        <section className="glass dash-card">
          <div className="dash-card-title">
            <h3>Seus artigos</h3>
            <button className="textbutton" onClick={go("/escrever")}>
              Novo artigo <ChevronRight size={15} />
            </button>
          </div>
          {articles === null ? (
            <p className="dash-muted" role="status">Carregando…</p>
          ) : articles.length === 0 ? (
            <p className="dash-muted">Artigos são textos mais longos, enviados para a revisão da equipe antes de entrar na Revista.</p>
          ) : (
            <ul className="dash-list">
              {articles.slice(0, 6).map((a) => {
                const [label, tone] = articleStatus[a.status] ?? [a.status, ""];
                return (
                  <li key={a.id}>
                    <div className="dash-item-main">
                      <strong>{a.title || "(sem título)"}</strong>
                      <small>
                        {a.status === "changes_requested" && a.reviewNote ? "Nota da equipe: " + a.reviewNote : dateFmt(a.updatedAt)}
                      </small>
                    </div>
                    <span className={"dash-chip " + tone}>{label}</span>
                    <div className="dash-item-actions">
                      {a.status === "published" ? (
                        <button className="textbutton" onClick={go("/revista/" + a.slug)}>Ler</button>
                      ) : (
                        <button className="textbutton" onClick={go("/escrever/" + a.id)}>
                          {["draft", "changes_requested"].includes(a.status) ? "Editar" : "Ver"}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="glass dash-card">
          <div className="dash-card-title">
            <h3>Seus pensamentos</h3>
            {(posts ?? []).length > 0 && (
              <button className="textbutton" onClick={go("/caderno")}>
                Abrir meu Caderno <ChevronRight size={15} />
              </button>
            )}
          </div>
          {posts === null ? (
            <p className="dash-muted" role="status">Carregando…</p>
          ) : posts.length === 0 ? (
            <div className="dash-empty">
              <PenLine size={30} />
              <h4>Seu primeiro pensamento começa aqui.</h4>
              <p>Uma ideia, uma anotação ou uma reflexão curta. Publique na hora ou salve como rascunho.</p>
              <button className="primary" onClick={go("/caderno?novo=1")}>
                Escrever pensamento
              </button>
            </div>
          ) : (
            <ul className="dash-list">
              {posts.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <div className="dash-item-main">
                    <strong>{p.title}</strong>
                    <small>
                      {p.format} · {p.area} · {dateFmt(p.updatedAt)}
                    </small>
                  </div>
                  <span className={p.status === "published" ? "dash-chip on" : "dash-chip"}>
                    {p.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                  <div className="dash-item-actions">
                    <button className="textbutton" onClick={go(`/caderno?edit=${p.id}`)}>
                      Editar
                    </button>
                    {p.status === "published" && (
                      <button className="textbutton" onClick={go(`/textos/${p.id}`)}>
                        Ler
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        </div>

        <aside className="dash-side">
          <section className="glass dash-card">
            <h3>Comece por aqui</h3>
            <ol className="dash-steps">
              {steps.map((s) => (
                <li key={s.label} className={s.done ? "done" : s === nextStep ? "next" : ""}>
                  {s.done ? <Check size={16} /> : <Circle size={16} />}
                  <span>{s.label}</span>
                  {s === nextStep && (
                    <button className="textbutton" onClick={go(s.action)}>
                      {s.cta}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section className="glass dash-card">
            <h3>Criar algo</h3>
            <div className="dash-shortcuts">
              <button onClick={go("/escrever")}>
                <BookOpen size={18} />
                <span>
                  <strong>Artigo para a Revista</strong>
                  <small>Passa pela revisão da equipe</small>
                </span>
              </button>
              <button onClick={go("/caderno?novo=1")}>
                <FileText size={18} />
                <span>
                  <strong>Pensamento</strong>
                  <small>Ideia, anotação, poesia</small>
                </span>
              </button>
              <button onClick={() => onNavigate("projetos")} disabled={!advanced}>
                <FolderKanban size={18} />
                <span>
                  <strong>Projeto</strong>
                  <small>{advanced ? "Problema, orçamento e etapas" : "Exige perfil de criador"}</small>
                </span>
              </button>
              <button onClick={() => onNavigate("pesquisador")}>
                <BookOpen size={18} />
                <span>
                  <strong>Outros envios</strong>
                  <small>{submissions ? `${submissions} envio(s) feito(s)` : "Livro, projeto ou candidatura"}</small>
                </span>
              </button>
              <button onClick={() => onSection("access")} disabled={!advanced}>
                <FlaskConical size={18} />
                <span>
                  <strong>Perfil de pesquisador</strong>
                  <small>{advanced ? "Solicitar acesso científico" : "Exige perfil de criador"}</small>
                </span>
              </button>
            </div>
          </section>
        </aside>
      </div>

      <p className="dash-note">
        Textos do Caderno são de autoria independente e não recebem avaliação ou selo da NEW automaticamente.
      </p>
    </div>
  );
}
