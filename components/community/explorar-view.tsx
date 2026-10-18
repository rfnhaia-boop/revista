"use client";
import "./comunidade.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Feather, Plus, Search, Sparkles, Users } from "lucide-react";
import type { FeedArticle, FeedPost, PersonCard } from "@/lib/community-data";
import { forYou, unlockedFor } from "@/lib/feed";
import ThoughtCard, { Avatar } from "./thought-card";
import ArticleCard from "./article-card";
import { FollowButton } from "./relation-buttons";

const TOPICS = ["Todos", "Psicologia", "Tecnologia", "Educação", "Sociedade", "Filosofia", "Negócios", "Literatura"];
type Tab = "paravoce" | "recentes" | "seguindo" | "salvos";
type Kind = "tudo" | "artigos" | "pensamentos";
type Item = { k: "p"; date: string; post: FeedPost } | { k: "a"; date: string; article: FeedArticle };
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ExplorarView({
  posts,
  articles,
  authors,
  following,
  bookmarks,
  subscribed,
  purchased,
  signedIn,
  myId,
}: {
  posts: FeedPost[];
  articles: FeedArticle[];
  authors: PersonCard[];
  following: string[];
  bookmarks: string[];
  subscribed: string[];
  purchased: string[];
  signedIn: boolean;
  myId: string;
}) {
  const [tab, setTab] = useState<Tab>(signedIn ? "paravoce" : "recentes");
  const [kind, setKind] = useState<Kind>("tudo");
  const [topic, setTopic] = useState("Todos");
  const [q, setQ] = useState("");
  const followSet = useMemo(() => new Set(following), [following]);
  const saveSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const subSet = useMemo(() => new Set(subscribed), [subscribed]);
  const buySet = useMemo(() => new Set(purchased), [purchased]);
  const profileBySlug = useMemo(() => new Map(authors.map((a) => [a.slug, a.id])), [authors]);
  const followedSlugs = useMemo(() => new Set(authors.filter((a) => followSet.has(a.id)).map((a) => a.slug)), [authors, followSet]);

  const items = useMemo(() => {
    const nq = norm(q.trim());
    const nt = norm(topic);
    const out: Item[] = [];
    if (kind !== "artigos")
      for (const p of posts) {
        if (tab === "seguindo" && !followSet.has(p.profileId)) continue;
        if (tab === "salvos" && !saveSet.has(p.id)) continue;
        if (topic !== "Todos" && norm(p.area) !== nt) continue;
        if (nq && !norm(`${p.title} ${p.excerpt} ${p.authorName} ${p.format}`).includes(nq)) continue;
        out.push({ k: "p", date: p.createdAt, post: p });
      }
    if (kind !== "pensamentos" && tab !== "salvos")
      for (const a of articles) {
        if (tab === "seguindo" && !(a.authorSlug && followedSlugs.has(a.authorSlug))) continue;
        if (topic !== "Todos" && norm(a.area) !== nt) continue;
        if (nq && !norm(`${a.title} ${a.summary} ${a.authorName} ${a.type}`).includes(nq)) continue;
        out.push({ k: "a", date: a.publishedAt, article: a });
      }
    if (tab === "paravoce") {
      const entries = out.map((it) =>
        it.k === "p"
          ? { it, id: it.post.id, date: it.date, profileId: it.post.profileId, paid: it.post.access === "paid" }
          : { it, id: "a:" + it.article.slug, date: it.date, profileId: (it.article.authorSlug && profileBySlug.get(it.article.authorSlug)) || null, paid: false },
      );
      return forYou(entries, { subscribed: subSet, following: followSet, purchased: buySet }).map((e) => e.it);
    }
    return out.sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
  }, [posts, articles, tab, kind, topic, q, followSet, saveSet, followedSlugs, subSet, buySet, profileBySlug]);

  const suggested = authors.filter((a) => a.posts + a.articles > 0 && a.id !== myId && !followSet.has(a.id)).slice(0, 5);
  const filtering = !!q.trim() || topic !== "Todos" || kind !== "tudo";
  const needLogin = !signedIn && tab !== "recentes" && tab !== "paravoce";

  let title = "Ainda não há publicações.";
  let text = "Seja a primeira pessoa a publicar.";
  if (needLogin) {
    title = "Entre para ver esta aba.";
    text = "Com uma conta você segue autores e guarda textos para ler depois.";
  } else if (filtering) {
    title = "Nada encontrado com esses filtros.";
    text = "Tente outra palavra ou escolha outro tema.";
  } else if (tab === "paravoce") {
    title = "Seu feed ainda está vazio.";
    text = "Siga autores ou assine um Caderno para ver aqui o que eles publicam, junto com os textos abertos da comunidade.";
  } else if (tab === "seguindo") {
    title = "Você ainda não segue ninguém.";
    text = "Siga autores para acompanhar o que eles publicam.";
  } else if (tab === "salvos") {
    title = "Suas leituras salvas aparecem aqui.";
    text = "Use o marcador em um pensamento para guardá-lo.";
  }

  return (
    <div className="cm">
      <header className="cm-hero">
        <div>
          <div className="eyebrow">EXPLORAR</div>
          <h1>Ideias que encontram pessoas.</h1>
          <p>Artigos revisados e pensamentos de autores independentes. Leia, converse e acompanhe quem pensa com você.</p>
        </div>
        <div className="cm-hero-actions">
          <Link className="outline" href="/escrever"><Plus size={16} /> Escrever artigo</Link>
          <Link className="primary" href="/escrever/pensamento"><Plus size={16} /> Escrever pensamento</Link>
        </div>
      </header>

      <div className="cm-controls">
        <label className="cm-search">
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, tema ou autor" aria-label="Buscar" />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Limpar busca">×</button>}
        </label>
        <div className="cm-chips" role="group" aria-label="Filtrar por tema">
          {TOPICS.map((t) => (
            <button key={t} className={topic === t ? "on" : ""} aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="cm-layout">
        <section>
          <div className="cm-subbar">
            <nav className="cm-tabs" role="tablist" aria-label="Feed">
              {([...(signedIn ? [["paravoce", "Para você"]] : []), ["recentes", "Recentes"], ["seguindo", "Seguindo"], ["salvos", "Salvos"]] as [Tab, string][]).map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
              ))}
            </nav>
            <div className="cm-seg" role="group" aria-label="Tipo de publicação">
              {([["tudo", "Tudo"], ["artigos", "Artigos"], ["pensamentos", "Pensamentos"]] as [Kind, string][]).map(([k, l]) => (
                <button key={k} className={kind === k ? "on" : ""} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>
              ))}
            </div>
          </div>

          {needLogin || items.length === 0 ? (
            <div className="cm-empty">
              {tab === "salvos" ? <Bookmark size={30} /> : tab === "seguindo" ? <Users size={30} /> : tab === "paravoce" ? <Sparkles size={30} /> : <Feather size={30} />}
              <h3>{title}</h3>
              <p>{text}</p>
              {needLogin ? (
                <Link className="primary" href="/entrar?return_to=%2Fexplorar">Entrar na minha conta</Link>
              ) : filtering ? (
                <button className="outline" onClick={() => { setQ(""); setTopic("Todos"); setKind("tudo"); }}>Limpar filtros</button>
              ) : tab !== "recentes" ? (
                <button className="outline" onClick={() => setTab("recentes")}>Ver recentes</button>
              ) : (
                <Link className="primary" href="/escrever/pensamento">Escrever pensamento</Link>
              )}
            </div>
          ) : (
            <div className="cm-feed">
              {items.map((it) =>
                it.k === "p" ? (
                  <ThoughtCard key={"p" + it.post.id} post={it.post} saved={saveSet.has(it.post.id)} signedIn={signedIn} unlocked={unlockedFor({ id: it.post.id, profileId: it.post.profileId }, { subscribed: subSet, purchased: buySet })} />
                ) : (
                  <ArticleCard key={"a" + it.article.slug} article={it.article} />
                ),
              )}
            </div>
          )}
        </section>

        <aside className="cm-aside">
          {suggested.length > 0 && (
            <div className="cm-box">
              <h2>Autores para seguir</h2>
              <ul className="cm-people-mini">
                {suggested.map((a) => (
                  <li key={a.id}>
                    <Link href={`/pessoas/${a.slug}`} className="cm-author">
                      <Avatar name={a.name} size={40} />
                      <span>
                        {a.name}
                        <small>{a.headline || `${a.articles + a.posts} publicações`}</small>
                      </span>
                    </Link>
                    <FollowButton profileId={a.id} following={false} signedIn={signedIn} size="sm" />
                  </li>
                ))}
              </ul>
              <Link href="/pessoas" className="cm-more">Ver todas as pessoas →</Link>
            </div>
          )}
          <div className="cm-box cm-cta">
            <Feather size={22} />
            <h2>Tem uma ideia grande?</h2>
            <p>Escreva um artigo completo, envie para a equipe revisar e publique com o seu nome. Pode enviar quantos quiser.</p>
            <Link className="outline" href="/escrever">Escrever um artigo</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
