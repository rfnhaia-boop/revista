import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { FeedPost } from "@/lib/community-data";
import { BookmarkButton } from "./relation-buttons";

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span className="cm-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }} aria-hidden="true">
      {name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

/** Cartão de um pensamento no feed. O cartão inteiro é clicável; salvar e o autor ficam acima do link. */
export default function ThoughtCard({ post, saved, signedIn, showAuthor = true, unlocked = false }: { post: FeedPost; saved: boolean; signedIn: boolean; showAuthor?: boolean; unlocked?: boolean }) {
  return (
    <article className="cm-card">
      <div className="cm-card-top">
        {showAuthor ? (
          <Link href={`/pessoas/${post.authorSlug}`} className="cm-author">
            <Avatar name={post.authorName} />
            <span>
              {post.authorName}
              <small>{shortDate(post.createdAt)}</small>
            </span>
          </Link>
        ) : (
          <span className="cm-date">{shortDate(post.createdAt)}</span>
        )}
        <BookmarkButton postId={post.id} saved={saved} signedIn={signedIn} />
      </div>
      <div className="cm-kicker">
        {post.format} · {post.area}
        {post.access === "paid" && (
          <span className={unlocked ? "cm-pill cm-pill-on" : "cm-pill"}>
            {unlocked ? "Liberado para você" : `Pago · ${(post.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
          </span>
        )}
      </div>
      <h3>
        <Link href={`/textos/${post.id}`} className="cm-stretch">{post.title}</Link>
      </h3>
      <p className="cm-excerpt">{post.excerpt}</p>
      <div className="cm-meta">
        <span>{post.minutes} min de leitura</span>
        <span title="Isso me ajudou"><Heart size={14} /> {post.likes}</span>
        <span title="Respostas"><MessageCircle size={14} /> {post.replies}</span>
      </div>
    </article>
  );
}
