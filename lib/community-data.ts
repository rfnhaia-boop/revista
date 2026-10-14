import { database } from "@/lib/storage";

export type FeedPost = {
  id: string;
  title: string;
  excerpt: string;
  format: string;
  area: string;
  createdAt: string;
  profileId: string;
  authorName: string;
  authorSlug: string;
  likes: number;
  replies: number;
  minutes: number;
};

export type PersonCard = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  location: string;
  bio: string;
  interests: string[];
  link: string;
  followers: number;
  posts: number;
};

export type PersonFull = PersonCard & { trajectory: string; isMine: boolean };

const splitInterests = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

type PostRow = Omit<FeedPost, "minutes"> & { chars: number };

/** Pensamentos publicados, do mais recente ao mais antigo (opcionalmente só de um autor). */
export async function listFeed(opts: { authorSlug?: string; limit?: number } = {}): Promise<FeedPost[]> {
  const params: unknown[] = ["published"];
  let where = "n.status=?";
  if (opts.authorSlug) {
    where += " AND p.slug=?";
    params.push(opts.authorSlug);
  }
  const r = await database()
    .prepare(
      `SELECT n.id,n.title,n.excerpt,n.format,n.area,n.created_at AS createdAt,n.profile_id AS profileId,p.name AS authorName,p.slug AS authorSlug,
        (SELECT COUNT(*)::int FROM notebook_reactions x WHERE x.post_id=n.id) AS likes,
        (SELECT COUNT(*)::int FROM notebook_replies r WHERE r.post_id=n.id AND r.status='visible' AND r.owner_id<>n.owner_id) AS replies,
        length(n.body)::int AS chars
       FROM notebooks n JOIN profiles p ON p.id=n.profile_id WHERE ${where} ORDER BY n.created_at DESC LIMIT ${Math.min(opts.limit ?? 100, 200)}`,
    )
    .bind(...params)
    .all<PostRow>();
  return r.results.map(({ chars, ...p }) => ({ ...p, minutes: Math.max(1, Math.ceil(chars / 1200)) }));
}

type ProfileRow = Omit<PersonCard, "interests"> & { interests: string };

const PROFILE_COLS = `p.id,p.slug,p.name,p.headline,p.location,p.bio,p.interests,p.link,
  (SELECT COUNT(*)::int FROM follows f WHERE f.profile_id=p.id) AS followers,
  (SELECT COUNT(*)::int FROM notebooks n WHERE n.profile_id=p.id AND n.status='published') AS posts`;

/** Autores, com quem já publicou primeiro. */
export async function listProfiles(limit = 100): Promise<PersonCard[]> {
  const r = await database()
    .prepare(`SELECT ${PROFILE_COLS} FROM profiles p ORDER BY posts DESC, p.created_at DESC LIMIT ${Math.min(limit, 200)}`)
    .all<ProfileRow>();
  return r.results.map((p) => ({ ...p, interests: splitInterests(p.interests) }));
}

export async function getProfile(slug: string, uid: string): Promise<PersonFull | null> {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(slug)) return null;
  const r = await database()
    .prepare(`SELECT ${PROFILE_COLS},p.trajectory,(p.owner_id=?) AS isMine FROM profiles p WHERE p.slug=?`)
    .bind(uid, slug)
    .first<ProfileRow & { trajectory: string; isMine: boolean }>();
  return r ? { ...r, interests: splitInterests(r.interests) } : null;
}

/** Perfis que a pessoa segue e textos que ela salvou. */
export async function userRelations(uid: string): Promise<{ following: string[]; bookmarks: string[] }> {
  if (!uid) return { following: [], bookmarks: [] };
  const db = database();
  const [f, b] = await Promise.all([
    db.prepare("SELECT profile_id AS id FROM follows WHERE owner_id=?").bind(uid).all<{ id: string }>(),
    db.prepare("SELECT post_id AS id FROM bookmarks WHERE owner_id=?").bind(uid).all<{ id: string }>(),
  ]);
  return { following: f.results.map((x) => x.id), bookmarks: b.results.map((x) => x.id) };
}

/** Id do perfil da própria pessoa (ou string vazia). */
export async function myProfileId(uid: string): Promise<string> {
  if (!uid) return "";
  const r = await database().prepare("SELECT id FROM profiles WHERE owner_id=?").bind(uid).first<{ id: string }>();
  return r?.id ?? "";
}
