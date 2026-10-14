"use client";
import "./comunidade.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Feather, Plus, Search, Users } from "lucide-react";
import type { FeedPost, PersonCard } from "@/lib/community-data";
import ThoughtCard, { Avatar } from "./thought-card";
import { FollowButton } from "./relation-buttons";

const TOPICS = ["Todos", "Psicologia", "Tecnologia", "Educação", "Sociedade", "Filosofia", "Negócios", "Literatura"];
type Tab = "recentes" | "seguindo" | "salvos";
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function ExplorarView({ posts, authors, following, bookmarks, signedIn, myId }: { posts: FeedPost[]; authors: PersonCard[]; following: string[]; bookmarks: string[]; signedIn: boolean; myId: string }) {
  const [tab, setTab] = useState<Tab>("recentes");
  const [topic, setTopic] = useState("Todos");
  const [q, setQ] = useState("");
  const followSet = useMemo(() => new Set(following), [following]);
  const saveSet = useMemo(() => new Set(bookmarks), [bookmarks]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return posts.filter((p) => {
      if (tab === "seguindo" && !followSet.has(p.profileId)) return false;
      if (tab === "salvos" && !saveSet.has(p.id)) return false;
      if (topic !== "Todos" && p.area !== topic) return false;
      return !nq || norm(`${p.title} ${p.excerpt} ${p.authorName} ${p.format}`).includes(nq);
    });
  }, [posts, tab, topic, q, followSet, saveSet]);

  const suggested = authors.filter((a) => a.posts > 0 && a.id !== myId && !followSet.has(a.id)).slice(0, 5);
  const filtering = !!q.trim() || topic !== "Todos";
  const needLogin = !signedIn && tab !== "recentes";

  let title = "Ainda não há pensamentos publicados.";
  let text = "Seja a primeira pessoa a publicar.";
  if (needLogin) {
    title = "Entre para ver esta aba.";
    text = "Com uma conta você segue autores e guarda textos para ler depois.";
  } else if (filtering) {
    title = "Nada encontrado com esses filtros.";
    text = "Tente outra palavra ou escolha outro tema.";
  } else if (tab === "seguindo") {
    title = "Você ainda não segue ninguém.";
    text = "Siga autores para acompanhar o que eles publicam.";
  } else if (tab === "salvos") {
    title = "Suas leituras salvas aparecem aqui.";
    text = "Use o marcador em um texto para guardá-lo.";
  }

  return (
    <div className="cm">
      <header className="cm-hero">
        <div>
          <div className="eyebrow">EXPLORAR</div>
          <h1>Ideias que encontram pessoas.</h1>
          <p>Pensamentos, anotações e reflexões de autores independentes. Leia, converse e acompanhe quem pensa com você.</p>
        </div>
        <Link className="primary" href="/escrever/pensamento"><Plus size={16} /> Escrever pensamento</Link>
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
          <nav className="cm-tabs" role="tablist" aria-label="Feed">
            {([["recentes", "Recentes"], ["seguindo", "Seguindo"], ["salvos", "Salvos"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
            ))}
          </nav>

          {needLogin || list.length === 0 ? (
            <div className="cm-empty">
              {tab === "salvos" ? <Bookmark size={30} /> : tab === "seguindo" ? <Users size={30} /> : <Feather size={30} />}
              <h3>{title}</h3>
              <p>{text}</p>
              {needLogin ? (
                <Link className="primary" href="/entrar?return_to=%2Fexplorar">Entrar na minha conta</Link>
              ) : filtering ? (
                <button className="outline" onClick={() => { setQ(""); setTopic("Todos"); }}>Limpar filtros</button>
              ) : tab !== "recentes" ? (
                <button className="outline" onClick={() => setTab("recentes")}>Ver recentes</button>
              ) : (
                <Link className="primary" href="/escrever/pensamento">Escrever pensamento</Link>
              )}
            </div>
          ) : (
            <div className="cm-feed">
              {list.map((p) => (
                <ThoughtCard key={p.id} post={p} saved={saveSet.has(p.id)} signedIn={signedIn} />
              ))}
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
                        <small>{a.headline || `${a.posts} ${a.posts === 1 ? "publicação" : "publicações"}`}</small>
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
            <h2>Um espaço para pensar</h2>
            <p>Uma anotação, uma reflexão, um poema. Comece pequeno e veja quem lê.</p>
            <Link className="outline" href="/caderno">Abrir meu Caderno</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
