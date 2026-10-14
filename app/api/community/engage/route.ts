import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";
import { tooMany, clientIp } from "@/lib/rate-limit";
import { brDay, cleanReply, engageSchema, viewerKey, type Conversation, type Insights, type InboxItem, type PostStats, PERIODS } from "@/lib/engagement";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
type Post = { id: string; owner_id: string; status: string };

async function getPost(postId: string) {
  return database().prepare("SELECT id,owner_id,status FROM notebooks WHERE id=?").bind(postId).first<Post>();
}

/** Conversa de um pensamento (curtidas + respostas) ou painel do autor (?insights=1). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const uid = user?.userId || "";
  const params = new URL(request.url).searchParams;
  const db = database();
  try {
    if (params.get("insights")) {
      if (!user) return json({ error: "Entre na sua conta." }, 401);
      const n = Number(params.get("insights"));
      return json(await insights(uid, (PERIODS as readonly number[]).includes(n) ? n : 30));
    }
    if (params.get("inbox")) {
      if (!user) return json({ error: "Entre na sua conta." }, 401);
      const rows = await db
        .prepare(
          "SELECT r.id,r.post_id AS postId,n.title AS postTitle,r.author_name AS authorName,r.body,r.status,r.created_at AS createdAt,r.owner_id AS ownerId,r.seen_at AS seenAt FROM notebook_replies r JOIN notebooks n ON n.id=r.post_id WHERE n.owner_id=? ORDER BY r.created_at DESC LIMIT 150",
        )
        .bind(uid)
        .all<{ id: string; postId: string; postTitle: string; authorName: string; body: string; status: string; createdAt: string; ownerId: string; seenAt: string | null }>();
      const items: InboxItem[] = rows.results.map((r) => ({
        id: r.id, postId: r.postId, postTitle: r.postTitle, authorName: r.authorName, body: r.body,
        status: r.status as "visible" | "hidden", createdAt: r.createdAt, fromMe: r.ownerId === uid,
        isNew: !r.seenAt && r.ownerId !== uid && r.status === "visible",
      }));
      return json({ items });
    }
    const postId = (params.get("post") || "").slice(0, 40);
    const post = await getPost(postId);
    const mine = !!post && post.owner_id === uid;
    if (!post || (post.status !== "published" && !mine)) return json({ error: "Texto não encontrado." }, 404);
    if (params.get("stats")) {
      if (!mine) return json({ error: "Sem permissão." }, 403);
      return json(await postStats(postId));
    }
    const canModerate = mine || !!user?.isStaff;
    const likes = await db.prepare("SELECT COUNT(*)::int AS n FROM notebook_reactions WHERE post_id=?").bind(postId).first<{ n: number }>();
    const liked = uid
      ? await db.prepare("SELECT 1 AS ok FROM notebook_reactions WHERE id=?").bind(`${uid}:${postId}`).first()
      : null;
    const rows = await db
      .prepare(
        "SELECT id,author_name AS authorName,body,status,created_at AS createdAt,owner_id AS ownerId,seen_at AS seenAt FROM notebook_replies WHERE post_id=? ORDER BY created_at ASC LIMIT 200",
      )
      .bind(postId)
      .all<{ id: string; authorName: string; body: string; status: string; createdAt: string; ownerId: string; seenAt: string | null }>();
    const replies = rows.results
      .filter((r) => r.status === "visible" || canModerate || r.ownerId === uid)
      .map((r) => ({
        id: r.id,
        authorName: r.authorName,
        body: r.body,
        status: r.status as "visible" | "hidden",
        createdAt: r.createdAt,
        isMine: r.ownerId === uid,
        isNew: mine && !r.seenAt && r.ownerId !== uid && r.status === "visible",
      }));
    const out: Conversation & { canModerate: boolean } = { likes: likes?.n ?? 0, likedByMe: !!liked, replies, canModerate };
    return json(out);
  } catch {
    return json({ error: "Não foi possível carregar a conversa." }, 503);
  }
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "Formato inválido." }, 415);
  let p;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return json({ error: "Conteúdo muito grande." }, 413);
    const parsed = engageSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "Dados inválidos." }, 400);
    p = parsed.data;
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }
  const user = await getCurrentUser();
  const uid = user?.userId || "";
  const ip = clientIp(request);
  const db = database();
  const now = new Date().toISOString();
  try {
    if (p.action === "view") {
      if (tooMany(`view:${ip}`, 90, 60_000)) return json({ counted: false });
      const post = await getPost(p.postId);
      if (!post || post.status !== "published" || post.owner_id === uid) return json({ counted: false });
      const key = viewerKey(uid || null, ip, request.headers.get("user-agent") || "");
      const day = brDay();
      await db
        .prepare("INSERT INTO notebook_views (id,post_id,viewer_key,day,created_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING")
        .bind(`${p.postId}:${key}:${day}`, p.postId, key, day, now)
        .run();
      return json({ counted: true });
    }
    if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);

    if (p.action === "react") {
      const post = await getPost(p.postId);
      if (!post || post.status !== "published") return json({ error: "Texto não encontrado." }, 404);
      if (tooMany(`react:${uid}`, 60, 3600_000)) return json({ error: "Muitas ações seguidas. Tente em instantes." }, 429);
      const rid = `${uid}:${p.postId}`;
      if (p.enabled)
        await db.prepare("INSERT INTO notebook_reactions (id,post_id,owner_id,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING").bind(rid, p.postId, uid, now).run();
      else await db.prepare("DELETE FROM notebook_reactions WHERE id=? AND owner_id=?").bind(rid, uid).run();
      const n = await db.prepare("SELECT COUNT(*)::int AS n FROM notebook_reactions WHERE post_id=?").bind(p.postId).first<{ n: number }>();
      return json({ enabled: p.enabled, likes: n?.n ?? 0 });
    }

    if (p.action === "reply") {
      const post = await getPost(p.postId);
      if (!post || post.status !== "published") return json({ error: "Texto não encontrado." }, 404);
      if (tooMany(`reply:${uid}`, 10, 3600_000)) return json({ error: "Limite de respostas por hora atingido. Tente mais tarde." }, 429);
      const c = cleanReply(p.body);
      if ("error" in c) return json({ error: c.error }, 400);
      const reply = { id: crypto.randomUUID(), ...{ text: c.text } };
      await db
        .prepare("INSERT INTO notebook_replies (id,post_id,owner_id,author_name,body,status,seen_at,created_at) VALUES (?,?,?,?,?,?,?,?)")
        .bind(reply.id, p.postId, uid, user.displayName.slice(0, 100), reply.text, "visible", post.owner_id === uid ? now : null, now)
        .run();
      return json({ saved: true, id: reply.id });
    }

    if (p.action === "hide-reply") {
      const row = await db
        .prepare("SELECT r.id,n.owner_id AS postOwner FROM notebook_replies r JOIN notebooks n ON n.id=r.post_id WHERE r.id=?")
        .bind(p.replyId)
        .first<{ id: string; postOwner: string }>();
      if (!row) return json({ error: "Resposta não encontrada." }, 404);
      if (row.postOwner !== uid && !user.isStaff) return json({ error: "Você não pode moderar esta resposta." }, 403);
      await db.prepare("UPDATE notebook_replies SET status=? WHERE id=?").bind(p.hidden ? "hidden" : "visible", p.replyId).run();
      return json({ saved: true });
    }

    if (p.action === "mark-seen-all") {
      await db.prepare("UPDATE notebook_replies SET seen_at=? WHERE seen_at IS NULL AND post_id IN (SELECT id FROM notebooks WHERE owner_id=?)").bind(now, uid).run();
      return json({ saved: true });
    }
    // mark-seen: só o autor do pensamento zera o marcador de "novas respostas".
    const post = await getPost(p.postId);
    if (!post || post.owner_id !== uid) return json({ error: "Sem permissão." }, 403);
    await db.prepare("UPDATE notebook_replies SET seen_at=? WHERE post_id=? AND seen_at IS NULL").bind(now, p.postId).run();
    return json({ saved: true });
  } catch {
    console.error("Engagement write unavailable");
    return json({ error: "Não foi possível concluir agora. Tente novamente." }, 503);
  }
}

async function insights(uid: string, n: number): Promise<Insights> {
  const db = database();
  const DAY = 86400_000;
  const since = brDay(new Date(Date.now() - (n - 1) * DAY));
  const prevSince = brDay(new Date(Date.now() - (2 * n - 1) * DAY));
  const sinceIso = new Date(Date.now() - n * DAY).toISOString();
  const prevIso = new Date(Date.now() - 2 * n * DAY).toISOString();
  const mine = "SELECT id FROM notebooks WHERE owner_id=?";
  const viewTotals = (from: string, to: string | null) =>
    db
      .prepare(`SELECT COUNT(DISTINCT viewer_key)::int AS readers,COUNT(*)::int AS views FROM notebook_views WHERE day>=? ${to ? "AND day<?" : ""} AND post_id IN (${mine})`)
      .bind(...(to ? [from, to, uid] : [from, uid]))
      .first<{ readers: number; views: number }>();
  const repCount = (from: string, to: string | null) =>
    db
      .prepare(`SELECT COUNT(*)::int AS n FROM notebook_replies WHERE status='visible' AND owner_id<>? AND created_at>=? ${to ? "AND created_at<?" : ""} AND post_id IN (${mine})`)
      .bind(...(to ? [uid, from, to, uid] : [uid, from, uid]))
      .first<{ n: number }>();
  const likeCount = (from: string, to: string | null) =>
    db
      .prepare(`SELECT COUNT(*)::int AS n FROM notebook_reactions WHERE created_at>=? ${to ? "AND created_at<?" : ""} AND post_id IN (${mine})`)
      .bind(...(to ? [from, to, uid] : [from, uid]))
      .first<{ n: number }>();
  const [perDay, cur, prv, rc, rp, lc, lp, fresh, top] = await Promise.all([
    db.prepare(`SELECT day,COUNT(*)::int AS views FROM notebook_views WHERE day>=? AND post_id IN (${mine}) GROUP BY day`).bind(since, uid).all<{ day: string; views: number }>(),
    viewTotals(since, null),
    viewTotals(prevSince, since),
    repCount(sinceIso, null),
    repCount(prevIso, sinceIso),
    likeCount(sinceIso, null),
    likeCount(prevIso, sinceIso),
    db.prepare(`SELECT COUNT(*)::int AS n FROM notebook_replies WHERE status='visible' AND seen_at IS NULL AND owner_id<>? AND post_id IN (${mine})`).bind(uid, uid).first<{ n: number }>(),
    db
      .prepare(
        `SELECT n.id,n.title,
          (SELECT COUNT(DISTINCT viewer_key)::int FROM notebook_views v WHERE v.post_id=n.id AND v.day>=?) AS readers,
          (SELECT COUNT(*)::int FROM notebook_replies r WHERE r.post_id=n.id AND r.status='visible' AND r.owner_id<>n.owner_id) AS replies,
          (SELECT COUNT(*)::int FROM notebook_reactions x WHERE x.post_id=n.id) AS likes
         FROM notebooks n WHERE n.owner_id=? AND n.status='published' ORDER BY readers DESC, n.created_at DESC LIMIT 3`,
      )
      .bind(since, uid)
      .all<{ id: string; title: string; readers: number; replies: number; likes: number }>(),
  ]);
  const map = new Map(perDay.results.map((r) => [r.day, r.views]));
  const days = Array.from({ length: n }, (_, i) => {
    const day = brDay(new Date(Date.now() - (n - 1 - i) * DAY));
    return { day, views: map.get(day) ?? 0 };
  });
  return {
    period: n,
    prev: { readers: prv?.readers ?? 0, views: prv?.views ?? 0, replies: rp?.n ?? 0, likes: lp?.n ?? 0 },
    days,
    readers: cur?.readers ?? 0,
    views: cur?.views ?? 0,
    replies: rc?.n ?? 0,
    likes: lc?.n ?? 0,
    newReplies: fresh?.n ?? 0,
    top: top.results,
  };
}

async function postStats(postId: string): Promise<PostStats> {
  const db = database();
  const since = brDay(new Date(Date.now() - 29 * 86400_000));
  const [perDay, tot, reps, likes] = await Promise.all([
    db.prepare("SELECT day,COUNT(*)::int AS views FROM notebook_views WHERE post_id=? AND day>=? GROUP BY day").bind(postId, since).all<{ day: string; views: number }>(),
    db.prepare("SELECT COUNT(DISTINCT viewer_key)::int AS readers,COUNT(*)::int AS views FROM notebook_views WHERE post_id=?").bind(postId).first<{ readers: number; views: number }>(),
    db.prepare("SELECT COUNT(*)::int AS n FROM notebook_replies r JOIN notebooks n ON n.id=r.post_id WHERE r.post_id=? AND r.status='visible' AND r.owner_id<>n.owner_id").bind(postId).first<{ n: number }>(),
    db.prepare("SELECT COUNT(*)::int AS n FROM notebook_reactions WHERE post_id=?").bind(postId).first<{ n: number }>(),
  ]);
  const map = new Map(perDay.results.map((r) => [r.day, r.views]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = brDay(new Date(Date.now() - (29 - i) * 86400_000));
    return { day, views: map.get(day) ?? 0 };
  });
  return { days, readers: tot?.readers ?? 0, views: tot?.views ?? 0, replies: reps?.n ?? 0, likes: likes?.n ?? 0 };
}
