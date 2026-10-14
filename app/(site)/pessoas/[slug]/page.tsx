import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, MapPin, PenLine } from "lucide-react";
import "@/components/community/comunidade.css";
import ThoughtCard, { Avatar } from "@/components/community/thought-card";
import { FollowButton } from "@/components/community/relation-buttons";
import ShareButton from "@/components/community/share-button";
import { NotAvailableView } from "@/components/site/unavailable";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, listFeed, userRelations } from "@/lib/community-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfile(slug, "");
  if (!p) return { title: "Perfil · Revista NEW", robots: { index: false } };
  const desc = p.bio.length > 160 ? p.bio.slice(0, 157) + "…" : p.bio;
  return {
    title: `${p.name} · Revista NEW`,
    description: desc,
    alternates: { canonical: `/pessoas/${p.slug}` },
    openGraph: { type: "profile", title: p.name, description: desc, locale: "pt_BR", siteName: "Revista NEW" },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const uid = user?.userId ?? "";
  const profile = await getProfile(slug, uid);
  if (!profile)
    return <NotAvailableView signedIn={!!user} title="Esse perfil não existe" text="O endereço pode estar incompleto ou a pessoa pode ter mudado o endereço do perfil." />;
  const [posts, rel] = await Promise.all([listFeed({ authorSlug: slug }), userRelations(uid)]);
  const saved = new Set(rel.bookmarks);
  const link = profile.link ? profile.link.replace(/^https:\/\//, "").replace(/\/$/, "") : "";

  return (
    <div className="pp">
      <div className="pp-cover" aria-hidden="true" />
      <header className="pp-head">
        <Avatar name={profile.name} size={104} />
        <div className="pp-id">
          <div className="eyebrow">AUTOR INDEPENDENTE</div>
          <h1>{profile.name}</h1>
          {profile.headline && <p className="pp-headline">{profile.headline}</p>}
          <ul className="pp-meta">
            {profile.location && <li><MapPin size={14} /> {profile.location}</li>}
            {link && (
              <li>
                <ExternalLink size={14} />
                <a href={profile.link} target="_blank" rel="noopener noreferrer nofollow ugc">{link}</a>
              </li>
            )}
            <li><b>{profile.posts}</b> {profile.posts === 1 ? "publicação" : "publicações"}</li>
            <li><b>{profile.followers}</b> {profile.followers === 1 ? "seguidor" : "seguidores"}</li>
          </ul>
        </div>
        <div className="pp-actions">
          {profile.isMine ? (
            <>
              <Link className="outline small" href="/perfil"><PenLine size={14} /> Editar perfil</Link>
              <Link className="primary small" href="/caderno">Meu Caderno</Link>
            </>
          ) : (
            <FollowButton profileId={profile.id} following={rel.following.includes(profile.id)} signedIn={!!user} />
          )}
          <ShareButton path={`/pessoas/${profile.slug}`} title={profile.name} />
        </div>
      </header>

      {profile.interests.length > 0 && (
        <div className="cm-tags pp-tags">
          {profile.interests.map((i) => <span key={i}>{i}</span>)}
        </div>
      )}

      <div className="pp-layout">
        <section aria-label="Publicações">
          <h2 className="pp-h">Publicações</h2>
          {posts.length === 0 ? (
            <div className="cm-empty">
              <h3>{profile.isMine ? "Você ainda não publicou nada." : "Ainda não há publicações."}</h3>
              <p>{profile.isMine ? "Escreva seu primeiro pensamento e ele aparece aqui." : "Volte em breve ou siga para ser avisado."}</p>
              {profile.isMine && <Link className="primary" href="/escrever/pensamento">Escrever pensamento</Link>}
            </div>
          ) : (
            <div className="cm-feed">
              {posts.map((p) => (
                <ThoughtCard key={p.id} post={p} saved={saved.has(p.id)} signedIn={!!user} showAuthor={false} />
              ))}
            </div>
          )}
        </section>

        <aside className="pp-aside">
          <div className="cm-box">
            <h2>Sobre</h2>
            <p className="pp-text">{profile.bio}</p>
          </div>
          {profile.trajectory && (
            <div className="cm-box">
              <h2>Trajetória intelectual</h2>
              <p className="pp-text">{profile.trajectory}</p>
            </div>
          )}
          <p className="pp-note">Conteúdo independente. Os textos deste perfil não recebem avaliação ou selo da NEW.</p>
        </aside>
      </div>
    </div>
  );
}
