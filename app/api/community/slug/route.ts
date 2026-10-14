import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";
import { tooMany, clientIp } from "@/lib/rate-limit";
import { SLUG_RE } from "@/lib/profile-validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

/** Disponibilidade de um endereço de perfil (/pessoas/<slug>). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401, headers });
  if (tooMany(`slug:${clientIp(request)}`, 90, 60_000)) return Response.json({ error: "Muitas consultas." }, { status: 429, headers });
  const slug = (new URL(request.url).searchParams.get("slug") || "").slice(0, 60);
  if (!SLUG_RE.test(slug)) return Response.json({ valid: false, available: false }, { headers });
  const row = await database().prepare("SELECT owner_id FROM profiles WHERE slug=?").bind(slug).first<{ owner_id: string }>();
  return Response.json({ valid: true, available: !row || row.owner_id === user.userId }, { headers });
}
