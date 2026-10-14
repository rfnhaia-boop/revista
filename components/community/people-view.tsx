"use client";
import "./comunidade.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { PersonCard } from "@/lib/community-data";
import { Avatar } from "./thought-card";
import { FollowButton } from "./relation-buttons";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function PeopleView({ people, following, signedIn, myId }: { people: PersonCard[]; following: string[]; signedIn: boolean; myId: string }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const followSet = useMemo(() => new Set(following), [following]);
  const tags = useMemo(() => {
    const c = new Map<string, number>();
    people.forEach((p) => p.interests.forEach((i) => c.set(i, (c.get(i) ?? 0) + 1)));
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [people]);
  const list = useMemo(() => {
    const nq = norm(q.trim());
    return people.filter((p) => (!tag || p.interests.includes(tag)) && (!nq || norm(`${p.name} ${p.headline} ${p.bio} ${p.interests.join(" ")}`).includes(nq)));
  }, [people, q, tag]);

  return (
    <div className="cm">
      <header className="cm-hero">
        <div>
          <div className="eyebrow">PESSOAS</div>
          <h1>Encontre quem pensa com você.</h1>
          <p>Conheça autores independentes, o que eles estudam e o que já publicaram.</p>
        </div>
      </header>

      <div className="cm-controls">
        <label className="cm-search">
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, tema ou interesse" aria-label="Buscar pessoas" />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Limpar busca">×</button>}
        </label>
        {tags.length > 0 && (
          <div className="cm-chips" role="group" aria-label="Filtrar por interesse">
            <button className={!tag ? "on" : ""} aria-pressed={!tag} onClick={() => setTag("")}>Todos</button>
            {tags.map((t) => (
              <button key={t} className={tag === t ? "on" : ""} aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)}>{t}</button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="cm-empty">
          <h3>Ninguém encontrado.</h3>
          <p>Tente outro nome ou interesse.</p>
          <button className="outline" onClick={() => { setQ(""); setTag(""); }}>Limpar filtros</button>
        </div>
      ) : (
        <div className="cm-people">
          {list.map((p) => (
            <article key={p.id} className="cm-pcard">
              <Link href={`/pessoas/${p.slug}`} className="cm-pcard-head">
                <Avatar name={p.name} size={52} />
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.headline || "Autor independente"}</small>
                </span>
              </Link>
              <p className="cm-pbio">{p.bio}</p>
              {p.interests.length > 0 && (
                <div className="cm-tags">
                  {p.interests.slice(0, 4).map((i) => <span key={i}>{i}</span>)}
                </div>
              )}
              <div className="cm-pfoot">
                <span>{p.posts} {p.posts === 1 ? "publicação" : "publicações"} · {p.followers} {p.followers === 1 ? "seguidor" : "seguidores"}</span>
                {p.id === myId ? <Link href="/caderno" className="outline small">Meu Caderno</Link> : <FollowButton profileId={p.id} following={followSet.has(p.id)} signedIn={signedIn} size="sm" />}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
