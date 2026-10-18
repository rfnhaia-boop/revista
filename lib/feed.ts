/** Uma publicação candidata ao feed "Para você". */
export type FeedEntry = {
  id: string;
  date: string;
  /** Perfil do autor (null quando o autor não tem perfil, ex.: artigos da equipe). */
  profileId: string | null;
  /** Texto pago: só entra para quem assina o autor ou comprou este texto. */
  paid: boolean;
};

export const SUBSCRIBED_BOOST_DAYS = 14;
export const FOLLOWED_BOOST_DAYS = 3;
const DAY = 86_400_000;

/**
 * Feed "Para você": tudo que é aberto, mais o que os autores assinados publicam (mesmo pago).
 * Texto pago de quem não se assina nem se comprou fica de fora. A ordem é por data, com
 * um empurrão para autores assinados (14 dias) e seguidos (3 dias).
 */
export function forYou<T extends FeedEntry>(
  entries: T[],
  ctx: { subscribed: Set<string>; following: Set<string>; purchased: Set<string> },
): T[] {
  const score = (e: T) => {
    const t = Date.parse(e.date);
    if (e.profileId && ctx.subscribed.has(e.profileId)) return t + SUBSCRIBED_BOOST_DAYS * DAY;
    if (e.profileId && ctx.following.has(e.profileId)) return t + FOLLOWED_BOOST_DAYS * DAY;
    return t;
  };
  return entries
    .filter((e) => !e.paid || ctx.purchased.has(e.id) || (!!e.profileId && ctx.subscribed.has(e.profileId)))
    .sort((a, b) => score(b) - score(a));
}

/** O leitor tem este texto liberado? (assina o autor ou comprou o texto) */
export function unlockedFor(e: Pick<FeedEntry, "id" | "profileId">, ctx: { subscribed: Set<string>; purchased: Set<string> }) {
  return ctx.purchased.has(e.id) || (!!e.profileId && ctx.subscribed.has(e.profileId));
}
