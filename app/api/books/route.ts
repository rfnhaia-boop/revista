import { getCurrentUser } from "@/lib/auth";
import { BookError, addNote, deleteNote, saveProgress, toggleMark } from "@/lib/books";
import { readerActionSchema } from "@/lib/books-core";
import { clientIp, tooMany } from "@/lib/rate-limit";
import { validOrigin } from "@/lib/validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });

/** Anotações, marcações e progresso de leitura, sempre da própria conta. */
export async function POST(request: Request) {
  if (!validOrigin(request)) return json({ error: "Origem inválida." }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Entre na sua conta para guardar suas anotações." }, 401);
  if (tooMany("books:" + user.userId, 240, 10 * 60_000) || tooMany("books-ip:" + clientIp(request), 600, 10 * 60_000))
    return json({ error: "Muitas ações em pouco tempo." }, 429);
  const parsed = readerActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Revise o que você escreveu (até 2000 caracteres)." }, 400);
  const a = parsed.data;
  try {
    if (a.action === "note") return json({ ok: true, id: await addNote(user.userId, a) }, 201);
    if (a.action === "delete-note") {
      await deleteNote(user.userId, a.id);
      return json({ ok: true });
    }
    if (a.action === "toggle-mark") return json({ ok: true, marked: await toggleMark(user.userId, a.bookId, a.chapter, a.paragraph) });
    await saveProgress(user.userId, a.bookId, a.chapter, a.paragraph);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof BookError) return json({ error: e.message }, e.status);
    return json({ error: "Não foi possível concluir." }, 500);
  }
}
