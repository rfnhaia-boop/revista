import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, MapPin, PenLine } from "lucide-react";
import "@/components/community/comunidade.css";
import { Avatar } from "@/components/community/thought-card";
import ProfileContent from "@/components/community/profile-content";
import { FollowButton } from "@/components/community/relation-buttons";
import ShareButton from "@/components/community/share-button";
import { NotAvailableView } from "@/components/site/unavailable";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, listArticles, listFeed, userRelations } from "@/lib/community-data";

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
  const [posts, articles, rel] = await Promise.all([listFeed({ authorSlug: slug }), listArticles({ authorSlug: slug }), userRelations(uid)]);
  const link = profile.link ? profile.link.replace(/^https:\/\//, "").replace(/\/$/, "") : "";

  return (
    <div className="pp">
      <div className="pp-cover" aria-hidden="true" />
      <header className="pp-head">
        <div className="pp-avatar-wrap">
          <Avatar name={profile.name} size={112} />
        </div>
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

      <div className="pp-stats" role="list">
        <div role="listitem"><strong>{articles.length}</strong><span>{articles.length === 1 ? "artigo" : "artigos"}</span></div>
        <div role="listitem"><strong>{posts.length}</strong><span>{posts.length === 1 ? "pensamento" : "pensamentos"}</span></div>
        <div role="listitem"><strong>{profile.followers}</strong><span>{profile.followers === 1 ? "seguidor" : "seguidores"}</span></div>
      </div>

      {profile.interests.length > 0 && (
        <div className="cm-tags pp-tags">
          {profile.interests.map((i) => <span key={i}>{i}</span>)}
        </div>
      )}

      <div className="pp-layout">
        <ProfileContent posts={posts} articles={articles} saved={rel.bookmarks} signedIn={!!user} isMine={profile.isMine} />

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
          <p className="pp-note">Conteúdo independente. Os textos deste perfil não recebem avaliação ou selo da NEW, exceto onde a revisão editorial estiver indicada.</p>
        </aside>
      </div>
    </div>
  );
}
