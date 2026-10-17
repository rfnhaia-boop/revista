import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";
import { validOrigin } from "@/lib/validation";
import { communitySchema } from "@/lib/community-validation";
import { moneyEnabled } from "@/lib/features";
export const dynamic = "force-dynamic";
const responseHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: responseHeaders });
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const uid = user?.userId || "";
  const params = new URL(request.url).searchParams;
  const authorSlug = params.get("author")?.slice(0, 40) || "";
  const postId = params.get("post")?.slice(0, 40) || "";
  try {
    const db = database();
    const authors = await db
      .prepare(
        "SELECT p.id,p.slug,p.name,p.headline,p.location,p.bio,p.trajectory,p.interests,p.link,p.show_supporters AS showSupporters,(SELECT COUNT(*) FROM follows f WHERE f.profile_id=p.id) AS followers,((SELECT COUNT(*) FROM notebooks n WHERE n.profile_id=p.id AND n.status=?)+(SELECT COUNT(*) FROM articles a WHERE a.author_id=p.owner_id AND a.status='published')) AS postCount,p.owner_id=? AS isMine FROM profiles p ORDER BY (p.slug=? OR p.owner_id=?) DESC,p.created_at DESC LIMIT 100",
      )
      .bind("published", uid, authorSlug, uid)
      .all();
    const posts = await db
      .prepare(
        "SELECT n.id,n.profile_id AS profileId,n.title,n.excerpt,CASE WHEN n.owner_id=? OR (n.access='free' AND n.status='published') THEN n.body ELSE NULL END AS body,n.format,n.area,n.access,n.price_cents AS priceCents,n.status,n.created_at AS createdAt,n.updated_at AS updatedAt,p.name,p.slug,n.owner_id=? AS isMine,(SELECT COUNT(*)::int FROM notebook_reactions x WHERE x.post_id=n.id) AS likes,(SELECT COUNT(*)::int FROM notebook_replies r WHERE r.post_id=n.id AND r.status='visible' AND r.owner_id<>n.owner_id) AS replies,CASE WHEN n.owner_id=? THEN (SELECT COUNT(DISTINCT v.viewer_key)::int FROM notebook_views v WHERE v.post_id=n.id) ELSE NULL END AS readers,CASE WHEN n.owner_id=? THEN (SELECT COUNT(*)::int FROM notebook_replies r WHERE r.post_id=n.id AND r.status='visible' AND r.seen_at IS NULL AND r.owner_id<>n.owner_id) ELSE 0 END AS newReplies FROM notebooks n JOIN profiles p ON p.id=n.profile_id WHERE n.status='published' OR n.owner_id=? ORDER BY (n.id=? OR p.slug=? OR n.owner_id=?) DESC,n.created_at DESC LIMIT 100",
      )
      .bind(uid, uid, uid, uid, uid, postId, authorSlug, uid)
      .all();
    const following = user
      ? await db
          .prepare("SELECT profile_id AS id FROM follows WHERE owner_id=?")
          .bind(uid)
          .all<{ id: string }>()
      : { results: [] };
    const saved = user
      ? await db
          .prepare("SELECT post_id AS id FROM bookmarks WHERE owner_id=?")
          .bind(uid)
          .all<{ id: string }>()
      : { results: [] };
    return json({
      profiles: authors.results,
      posts: posts.results,
      following: following.results.map((r) => r.id),
      bookmarks: saved.results.map((r) => r.id),
      myProfile: authors.results.find((p) => p.isMine) || null,
    });
  } catch {
    console.error("Community read unavailable");
    return json(
      { error: "Não foi possível carregar a comunidade. Tente novamente." },
      503,
    );
  }
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para continuar." }, 401);
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Formato inválido." }, 415);
  let parsed;
  try {
    const raw = await request.text();
    if (raw.length > 150000)
      return json({ error: "Conteúdo muito grande." }, 413);
    parsed = communitySchema.safeParse(JSON.parse(raw));
  } catch {
    return json({ error: "Dados inválidos." }, 400);
  }
  if (!parsed.success)
    return json(
      { error: "Revise os campos obrigatórios, o link e o preço do conteúdo." },
      400,
    );
  try {
    const db = database();
    const p = parsed.data;
    const uid = user.userId;
    const now = new Date().toISOString();
    if (p.action === "profile") {
      const taken = await db
        .prepare("SELECT owner_id FROM profiles WHERE slug=?")
        .bind(p.slug)
        .first<{ owner_id: string }>();
      if (taken && taken.owner_id !== uid)
        return json(
          { error: "Este endereço já está em uso. Escolha outro." },
          409,
        );
      await db
        .prepare(
          "INSERT INTO profiles (id,owner_id,slug,name,headline,location,bio,trajectory,interests,link,show_supporters,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET slug=excluded.slug,name=excluded.name,headline=excluded.headline,location=excluded.location,bio=excluded.bio,trajectory=excluded.trajectory,interests=excluded.interests,link=excluded.link,show_supporters=excluded.show_supporters",
        )
        .bind(
          crypto.randomUUID(),
          uid,
          p.slug,
          p.name,
          p.headline,
          p.location,
          p.bio,
          p.trajectory,
          p.interests,
          p.link,
          p.showSupporters ? 1 : 0,
          now,
        )
        .run();
      return json({ saved: true });
    }
    if (p.action === "post") {
      if (p.access === "paid" && !moneyEnabled())
        return json({ error: "Conteúdo pago ainda não está disponível." }, 400);
      if (p.access === "paid") {
        const payout = await db.prepare("SELECT status FROM payout_accounts WHERE owner_id=?").bind(uid).first<{ status: string }>();
        if (!payout || payout.status === "creating" || payout.status === "rejected")
          return json({ error: "Abra sua conta de recebimento (aba Receber) antes de publicar conteúdo pago." }, 409);
      }
      const author = await db
        .prepare("SELECT id FROM profiles WHERE owner_id=?")
        .bind(uid)
        .first<{ id: string }>();
      if (!author)
        return json({ error: "Crie seu perfil antes de publicar." }, 409);
      const existing = await db
        .prepare("SELECT owner_id,status FROM notebooks WHERE id=?")
        .bind(p.id)
        .first<{ owner_id: string; status: string }>();
      if (existing && existing.owner_id !== uid)
        return json({ error: "Você não pode editar esta publicação." }, 403);
      if (existing?.status === "hidden")
        return json({ error: "Este texto foi ocultado pela equipe e não pode ser editado." }, 403);
      const count = await db
        .prepare(
          "SELECT COUNT(*) AS total FROM notebooks WHERE owner_id=? AND created_at>?",
        )
        .bind(uid, new Date(Date.now() - 3600000).toISOString())
        .first<{ total: number }>();
      if (!existing && (count?.total || 0) >= 20)
        return json(
          {
            error:
              "Limite de publicações atingido. Tente novamente em uma hora.",
          },
          429,
        );
      const mutation = existing
        ? db
            .prepare(
              "UPDATE notebooks SET title=?,excerpt=?,body=?,format=?,area=?,access=?,price_cents=?,status=?,updated_at=? WHERE id=? AND owner_id=?",
            )
            .bind(
              p.title,
              p.excerpt,
              p.body,
              p.format,
              p.area,
              p.access,
              p.priceCents,
              p.status,
              now,
              p.id,
              uid,
            )
        : db
            .prepare(
              "INSERT INTO notebooks (id,owner_id,profile_id,title,excerpt,body,format,area,access,price_cents,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            )
            .bind(
              p.id,
              uid,
              author.id,
              p.title,
              p.excerpt,
              p.body,
              p.format,
              p.area,
              p.access,
              p.priceCents,
              p.status,
              now,
              now,
            );
      await db.batch([
        mutation,
        db
          .prepare(
            "INSERT INTO audit_events (id,owner_id,entity_id,action,created_at) VALUES (?,?,?,?,?)",
          )
          .bind(crypto.randomUUID(), uid, p.id, "notebook." + p.status, now),
      ]);
      return json({ saved: true, id: p.id, status: p.status });
    }
    const target =
      p.action === "follow"
        ? await db
            .prepare("SELECT id,owner_id FROM profiles WHERE id=?")
            .bind(p.targetId)
            .first<{ id: string; owner_id: string }>()
        : await db
            .prepare(
              "SELECT id,owner_id FROM notebooks WHERE id=? AND (status='published' OR owner_id=?)",
            )
            .bind(p.targetId, uid)
            .first<{ id: string; owner_id: string }>();
    if (!target) return json({ error: "Conteúdo não encontrado." }, 404);
    if (p.action === "follow" && target.owner_id === uid)
      return json({ error: "Este é seu próprio perfil." }, 400);
    const rid = uid + ":" + p.targetId;
    if (p.action === "follow") {
      if (p.enabled)
        await db
          .prepare(
            "INSERT INTO follows (id,owner_id,profile_id,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING",
          )
          .bind(rid, uid, p.targetId, now)
          .run();
      else
        await db
          .prepare("DELETE FROM follows WHERE id=? AND owner_id=?")
          .bind(rid, uid)
          .run();
    } else {
      if (p.enabled)
        await db
          .prepare(
            "INSERT INTO bookmarks (id,owner_id,post_id,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING",
          )
          .bind(rid, uid, p.targetId, now)
          .run();
      else
        await db
          .prepare("DELETE FROM bookmarks WHERE id=? AND owner_id=?")
          .bind(rid, uid)
          .run();
    }
    return json({ saved: true, enabled: p.enabled });
  } catch {
    console.error("Community write unavailable");
    return json(
      {
        error:
          "Não foi possível confirmar a alteração. Seu texto foi preservado; tente novamente.",
      },
      503,
    );
  }
}
