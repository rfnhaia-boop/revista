import { audit, json, readBody, requireStaffApi } from "@/lib/admin";
import { BookError, bookAsText, createBook, listAdminBooks, setBookStatus, updateBook } from "@/lib/books";
import { bookActionSchema } from "@/lib/books-core";

export const dynamic = "force-dynamic";

/** Livros da biblioteca. Só administrador: a licença do texto é responsabilidade de quem cadastra. */
export async function GET(request: Request) {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const id = new URL(request.url).searchParams.get("id");
  if (id) return json({ text: await bookAsText(id) });
  return json({ items: await listAdminBooks() });
}

export async function POST(request: Request) {
  const me = await requireStaffApi(true);
  if (me instanceof Response) return me;
  const body = await readBody(request, bookActionSchema);
  if (body instanceof Response) return body;
  try {
    if (body.action === "create") {
      const r = await createBook(me.userId, body.book);
      await audit(me.userId, r.id, "book.created");
      return json({ ok: true, ...r }, 201);
    }
    if (body.action === "update") {
      const r = await updateBook(body.id, body.book);
      await audit(me.userId, body.id, "book.updated");
      return json({ ok: true, ...r });
    }
    await setBookStatus(body.id, body.action === "publish" ? "published" : "draft");
    await audit(me.userId, body.id, "book." + body.action + "ed");
    return json({ ok: true });
  } catch (e) {
    if (e instanceof BookError) return json({ error: e.message }, e.status);
    return json({ error: "Não foi possível concluir." }, 500);
  }
}
