"use client";
import "./caderno.css";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Eye, EyeOff, Heart, MessageCircle, PenLine, Plus, Share2, Users, Feather, Inbox, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import BarChart from "@/components/site/bar-chart";
import { delta, PERIODS, type InboxItem, type Insights } from "@/lib/engagement";
import type { Community, Entry } from "@/lib/community-types";

type Tab = "geral" | "textos" | "respostas" | "salvos";
type Filter = "todos" | "published" | "draft" | "hidden";
const TABS: Tab[] = ["geral", "textos", "respostas", "salvos"];
const when = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const short = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const STATUS: Record<string, string> = { published: "Publicado", draft: "Rascunho", hidden: "Oculto pela equipe" };

async function engage(payload: unknown) {
  const r = await fetch("/api/community/engage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error || "Não foi possível concluir.");
  return d;
}

export default function CadernoHome({ signedIn, initialTab }: { signedIn: boolean; initialTab: string }) {
  const [tab, setTab] = useState<Tab>((TABS as string[]).includes(initialTab) ? (initialTab as Tab) : "geral");
  const [data, setData] = useState<Community | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    fetch("/api/community")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Community) => alive && (setData(d), setError("")))
      .catch(() => alive && setError("Não foi possível carregar o seu Caderno."));
    return () => {
      alive = false;
    };
  }, [signedIn, tick]);

  function go(t: Tab) {
    setTab(t);
    window.history.replaceState(null, "", t === "geral" ? "/caderno" : `/caderno?aba=${t}`);
  }

  if (!signedIn)
    return (
      <div className="ch glass ch-empty">
        <Feather size={36} />
        <h1>Seu Caderno começa com a sua conta.</h1>
        <p>Entre para escrever pensamentos, acompanhar quem lê e conversar com seus leitores.</p>
        <Link className="primary" href={`/entrar?return_to=${encodeURIComponent("/caderno")}`}>Entrar na minha conta</Link>
      </div>
    );
  if (error) return <div className="ch glass ch-empty"><p>{error}</p><button className="outline" onClick={refresh}>Tentar novamente</button></div>;
  if (!data) return <div className="ch" aria-busy="true"><p className="dash-muted" role="status">Carregando seu Caderno…</p></div>;
  const me = data.myProfile;
  if (!me)
    return (
      <div className="ch glass ch-empty">
        <Feather size={36} />
        <h1>Crie seu perfil para abrir o Caderno.</h1>
        <p>Escolha um nome e um endereço público. Leva menos de um minuto, e depois você já pode escrever.</p>
        <Link className="primary" href="/perfil">Criar meu perfil</Link>
      </div>
    );

  const mine = data.posts.filter((p) => p.isMine);
  const saved = data.posts.filter((p) => data.bookmarks.includes(p.id) && p.status === "published");
  const newReplies = mine.reduce((a, p) => a + (p.newReplies ?? 0), 0);
  const drafts = mine.filter((p) => p.status === "draft").length;

  return (
    <div className="ch">
      <header className="ch-head">
        <div className="ch-me">
          <span className="ch-avatar">{me.name.slice(0, 1)}</span>
          <div>
            <h1>{me.name}</h1>
            <p>
              {me.postCount} {me.postCount === 1 ? "publicação" : "publicações"} · {me.followers} {me.followers === 1 ? "seguidor" : "seguidores"} ·{" "}
              <Link href={`/pessoas/${me.slug}`}>ver perfil público <ExternalLink size={12} /></Link>
            </p>
          </div>
        </div>
        <div className="ch-head-actions">
          <Link className="outline small" href="/perfil"><Users size={14} /> Editar perfil</Link>
          <Link className="primary" href="/escrever/pensamento"><Plus size={16} /> Escrever pensamento</Link>
        </div>
      </header>

      <nav className="ch-tabs" role="tablist" aria-label="Seções do Caderno">
        {(
          [
            ["geral", "Visão geral", 0],
            ["textos", "Meus textos", mine.length],
            ["respostas", "Respostas", newReplies],
            ["salvos", "Salvos", saved.length],
          ] as [Tab, string, number][]
        ).map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => go(k)}>
            {label}
            {k === "respostas" ? n > 0 && <i className="ch-dot">{n}</i> : n > 0 && <small>{n}</small>}
          </button>
        ))}
      </nav>

      {tab === "geral" && <Overview mine={mine} newReplies={newReplies} drafts={drafts} slug={me.slug} tick={tick} go={go} />}
      {tab === "textos" && <Texts mine={mine} />}
      {tab === "respostas" && <Replies onChange={refresh} hasNew={newReplies > 0} tick={tick} />}
      {tab === "salvos" && <Saved saved={saved} onChange={refresh} />}
    </div>
  );
}

function Overview({ mine, newReplies, drafts, slug, tick, go }: { mine: Entry[]; newReplies: number; drafts: number; slug: string; tick: number; go: (t: Tab) => void }) {
  const [period, setPeriod] = useState<number>(30);
  const [d, setD] = useState<Insights | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/community/engage?insights=${period}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x: Insights) => alive && setD(x))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [period, tick]);
  const published = mine.filter((p) => p.status === "published").length;

  if (published === 0)
    return (
      <section className="glass ch-empty ch-card">
        <PenLine size={32} />
        <h2>Publique o primeiro pensamento para ver a mágica.</h2>
        <p>Assim que alguém ler, responder ou marcar “Isso me ajudou”, os números aparecem aqui.</p>
        <Link className="primary" href="/escrever/pensamento"><Plus size={16} /> Escrever pensamento</Link>
      </section>
    );

  const tiles = d
    ? [
        { icon: <Eye size={18} />, label: "Leitores únicos", v: d.readers, p: d.prev.readers },
        { icon: <Eye size={18} />, label: "Leituras", v: d.views, p: d.prev.views },
        { icon: <MessageCircle size={18} />, label: "Respostas", v: d.replies, p: d.prev.replies },
        { icon: <Heart size={18} />, label: "Isso me ajudou", v: d.likes, p: d.prev.likes },
      ]
    : [];
  const peak = d ? d.days.reduce((a, b) => (b.views > a.views ? b : a), d.days[0]) : null;
  const topMax = Math.max(1, ...(d?.top.map((t) => t.readers) ?? [1]));

  return (
    <div className="ch-stack">
      <div className="ch-toolbar">
        <h2>Desempenho</h2>
        <div className="ch-seg" role="group" aria-label="Período">
          {PERIODS.map((n) => (
            <button key={n} className={period === n ? "on" : ""} aria-pressed={period === n} onClick={() => setPeriod(n)}>
              {n} dias
            </button>
          ))}
        </div>
      </div>

      <div className="ch-tiles">
        {(d ? tiles : [0, 1, 2, 3].map(() => null)).map((t, i) => {
          if (!t) return <div key={i} className="ch-tile skeleton" />;
          const dl = delta(t.v, t.p);
          return (
            <div key={t.label} className="ch-tile glass">
              <span className="ch-tile-icon">{t.icon}</span>
              <strong>{t.v.toLocaleString("pt-BR")}</strong>
              <span className="ch-tile-label">{t.label}</span>
              <span className={`ch-delta ${dl.tone}`} title={`Período anterior: ${t.p}`}>
                {dl.tone === "up" ? "▲" : dl.tone === "down" ? "▼" : ""} {dl.text} <small>vs. {period} dias antes</small>
              </span>
            </div>
          );
        })}
      </div>

      <section className="glass ch-card">
        <div className="ch-card-head">
          <h3>Leituras por dia</h3>
          {d && d.views > 0 && peak && <span>Pico: {peak.views} em {short(peak.day)}</span>}
        </div>
        {d ? (
          d.views === 0 ? (
            <p className="ch-muted">Nenhuma leitura nos últimos {period} dias. Compartilhe o link de um pensamento para começar.</p>
          ) : (
            <BarChart
              data={d.days.map((x) => ({ label: short(x.day), value: x.views }))}
              unit={["leitura", "leituras"]}
              summary={`Leituras por dia nos últimos ${period} dias: ${d.views} no total, pico de ${peak?.views} em ${peak ? short(peak.day) : ""}.`}
            />
          )
        ) : (
          <div className="ch-chart-skel" />
        )}
      </section>

      <div className="ch-two">
        <section className="glass ch-card">
          <div className="ch-card-head"><h3>O que está funcionando</h3><span>leitores no período</span></div>
          {d && d.top.some((t) => t.readers > 0) ? (
            <ol className="ch-top">
              {d.top.map((t) => (
                <li key={t.id}>
                  <Link href={`/textos/${t.id}`}>{t.title}</Link>
                  <div className="ch-bar"><i style={{ width: `${Math.max(4, (t.readers / topMax) * 100)}%` }} /></div>
                  <small>{t.readers} leitores · {t.replies} respostas · {t.likes} ♥</small>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ch-muted">Ainda sem leituras neste período.</p>
          )}
        </section>

        <section className="glass ch-card">
          <div className="ch-card-head"><h3>Precisa de você</h3></div>
          <ul className="ch-todo">
            {newReplies > 0 && (
              <li>
                <MessageCircle size={18} />
                <div><b>{newReplies} {newReplies === 1 ? "resposta nova" : "respostas novas"}</b><small>Leitores esperando uma conversa.</small></div>
                <button className="primary small" onClick={() => go("respostas")}>Ver respostas</button>
              </li>
            )}
            {drafts > 0 && (
              <li>
                <PenLine size={18} />
                <div><b>{drafts} {drafts === 1 ? "rascunho" : "rascunhos"}</b><small>Termine e publique quando estiver pronto.</small></div>
                <button className="outline small" onClick={() => go("textos")}>Abrir</button>
              </li>
            )}
            <li>
              <Share2 size={18} />
              <div><b>Divulgue seu Caderno</b><small>Mais gente chegando, mais conversa.</small></div>
              <button
                className="outline small"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/pessoas/${slug}`).then(() => toast.success("Link do seu Caderno copiado."), () => toast.info("Não foi possível copiar."))}
              >
                Copiar link
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Texts({ mine }: { mine: Entry[] }) {
  const [f, setF] = useState<Filter>("todos");
  const count = (s: string) => mine.filter((p) => p.status === s).length;
  const list = mine.filter((p) => f === "todos" || p.status === f).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return (
    <div className="ch-stack">
      <div className="ch-toolbar">
        <h2>Meus textos</h2>
        <div className="ch-seg" role="group" aria-label="Filtrar por situação">
          {(
            [
              ["todos", `Todos ${mine.length}`],
              ["published", `Publicados ${count("published")}`],
              ["draft", `Rascunhos ${count("draft")}`],
              ...(count("hidden") ? [["hidden", `Ocultos ${count("hidden")}`]] : []),
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button key={k} className={f === k ? "on" : ""} aria-pressed={f === k} onClick={() => setF(k)}>{label}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <section className="glass ch-empty ch-card">
          <PenLine size={30} />
          <h3>{mine.length === 0 ? "Nenhum texto ainda." : "Nada neste filtro."}</h3>
          <Link className="primary" href="/escrever/pensamento"><Plus size={16} /> Escrever pensamento</Link>
        </section>
      ) : (
        <ul className="ch-rows">
          {list.map((p) => (
            <li key={p.id} className="ch-row glass">
              <Link href={p.status === "draft" ? `/escrever/pensamento/${p.id}` : `/textos/${p.id}`} className="ch-row-main">
                <span className={`ch-pill ${p.status}`}>{STATUS[p.status] ?? p.status}</span>
                <strong>{p.title}</strong>
                <small>{p.format} · {p.area} · {p.status === "draft" ? "salvo" : "publicado"} em {when(p.updatedAt)}</small>
              </Link>
              {p.status === "published" && (
                <div className="ch-metrics">
                  <span title="Leitores únicos"><Eye size={15} /> {p.readers ?? 0}</span>
                  <span title="Respostas"><MessageCircle size={15} /> {p.replies ?? 0}</span>
                  <span title="Isso me ajudou"><Heart size={15} /> {p.likes ?? 0}</span>
                  {!!p.newReplies && <i className="ch-dot">{p.newReplies} nova{p.newReplies > 1 ? "s" : ""}</i>}
                </div>
              )}
              {p.status !== "hidden" && (
                <Link className="outline small" href={`/escrever/pensamento/${p.id}`}><PenLine size={14} /> Editar</Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Replies({ onChange, hasNew, tick }: { onChange: () => void; hasNew: boolean; tick: number }) {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [only, setOnly] = useState<"novas" | "todas">(hasNew ? "novas" : "todas");
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [local, setLocal] = useState(0);
  // Respostas novas de quando a aba abriu continuam destacadas durante a visita, mesmo depois de marcadas como vistas.
  const [fresh, setFresh] = useState<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/community/engage?inbox=1")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x: { items: InboxItem[] }) => {
        if (!alive) return;
        setItems(x.items);
        setFresh((f) => f ?? new Set(x.items.filter((i) => i.isNew).map((i) => i.id)));
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [tick, local]);

  // Abrir a caixa de respostas marca as novas como vistas (o destaque some depois de um instante).
  useEffect(() => {
    if (!hasNew) return;
    const t = setTimeout(() => void engage({ action: "mark-seen-all" }).then(onChange).catch(() => {}), 4000);
    return () => clearTimeout(t);
  }, [hasNew, onChange]);

  async function send(postId: string) {
    setSending(true);
    try {
      await engage({ action: "reply", postId, body: text });
      setText("");
      setOpen(null);
      setLocal((x) => x + 1);
      toast.success("Resposta enviada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }
  async function moderate(id: string, hidden: boolean) {
    try {
      await engage({ action: "hide-reply", replyId: id, hidden });
      setLocal((x) => x + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    }
  }

  const isFresh = (i: InboxItem) => i.isNew || !!fresh?.has(i.id);
  const list = (items ?? []).filter((i) => only === "todas" || isFresh(i));
  return (
    <div className="ch-stack">
      <div className="ch-toolbar">
        <h2>Respostas</h2>
        <div className="ch-seg" role="group" aria-label="Filtrar respostas">
          <button className={only === "novas" ? "on" : ""} aria-pressed={only === "novas"} onClick={() => setOnly("novas")}>Novas</button>
          <button className={only === "todas" ? "on" : ""} aria-pressed={only === "todas"} onClick={() => setOnly("todas")}>Todas</button>
        </div>
      </div>
      {items === null ? (
        <p className="dash-muted" role="status">Carregando…</p>
      ) : list.length === 0 ? (
        <section className="glass ch-empty ch-card">
          <Inbox size={30} />
          <h3>{only === "novas" ? "Você está em dia." : "Ainda não há respostas."}</h3>
          <p>{only === "novas" ? "Quando alguém responder a um pensamento seu, aparece aqui." : "Compartilhe seus pensamentos para começar conversas."}</p>
          {only === "novas" && (items?.length ?? 0) > 0 && <button className="outline" onClick={() => setOnly("todas")}>Ver todas as respostas</button>}
        </section>
      ) : (
        <ul className="ch-inbox">
          {list.map((i) => (
            <li key={i.id} className={`glass ${isFresh(i) ? "new" : ""} ${i.status === "hidden" ? "hidden" : ""}`}>
              <div className="ch-in-head">
                <span className="avatar-text">{i.authorName.slice(0, 1)}</span>
                <strong>{i.fromMe ? "Você" : i.authorName}</strong>
                <small>em <Link href={`/textos/${i.postId}`}>{i.postTitle}</Link> · {when(i.createdAt)}</small>
                {isFresh(i) && <i className="ch-dot">nova</i>}
                {i.status === "hidden" && <span className="ch-pill hidden">oculta</span>}
              </div>
              <p>{i.body}</p>
              <div className="ch-in-actions">
                {!i.fromMe && (
                  <button className="outline small" onClick={() => { setOpen(open === i.id ? null : i.id); setText(""); }}>
                    <MessageCircle size={14} /> Responder
                  </button>
                )}
                {!i.fromMe && (
                  <button className="textbutton" onClick={() => void moderate(i.id, i.status === "visible")}>
                    {i.status === "visible" ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Reexibir</>}
                  </button>
                )}
              </div>
              {open === i.id && (
                <form className="ch-reply" onSubmit={(e) => { e.preventDefault(); void send(i.postId); }}>
                  <textarea autoFocus rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} aria-label="Sua resposta" placeholder={`Responder a ${i.authorName}…`} />
                  <div>
                    <small>{text.length}/1000</small>
                    <button className="primary small" disabled={sending || text.trim().length < 2}>{sending ? "Enviando…" : "Enviar resposta"}</button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Saved({ saved, onChange }: { saved: Entry[]; onChange: () => void }) {
  async function remove(id: string) {
    const r = await fetch("/api/community", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bookmark", targetId: id, enabled: false }) });
    if (r.ok) onChange();
  }
  return (
    <div className="ch-stack">
      <div className="ch-toolbar"><h2>Salvos</h2></div>
      {saved.length === 0 ? (
        <section className="glass ch-empty ch-card">
          <Bookmark size={30} />
          <h3>Suas leituras salvas aparecem aqui.</h3>
          <p>Ao ler um texto de outra pessoa, use o marcador para guardá-lo.</p>
          <Link className="outline" href="/explorar">Explorar ideias</Link>
        </section>
      ) : (
        <ul className="ch-rows">
          {saved.map((p) => (
            <li key={p.id} className="ch-row glass">
              <Link href={`/textos/${p.id}`} className="ch-row-main">
                <strong>{p.title}</strong>
                <small>{p.name} · {p.format} · {p.area}</small>
                <span className="ch-excerpt">{p.excerpt}</span>
              </Link>
              <button className="outline small" onClick={() => void remove(p.id)}><Bookmark size={14} fill="currentColor" /> Remover</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
