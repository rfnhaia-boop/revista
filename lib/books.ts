import { citationMarkdown, parseChapters, slugify, splitParagraphs, type License } from "@/lib/books-core";
import { database } from "@/lib/storage";

export class BookError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type BookCard = { id: string; slug: string; title: string; author: string; year: number | null; description: string; license: License; chapters: number };
export type BookFull = BookCard & { status: string; licenseNote: string };
export type Chapter = { position: number; title: string; paragraphs: string[] };

const CARD = `b.id,b.slug,b.title,b.author,b.year,b.description,b.license,
  (SELECT COUNT(*)::int FROM book_chapters c WHERE c.book_id=b.id) AS chapters`;

export async function listPublishedBooks(): Promise<BookCard[]> {
  try {
    const r = await database().prepare(`SELECT ${CARD} FROM books b WHERE b.status='published' ORDER BY b.created_at ASC`).all<BookCard>();
    return r.results;
  } catch {
    return [];
  }
}

export async function getPublishedBook(slug: string): Promise<BookFull | null> {
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return null;
  return database()
    .prepare(`SELECT ${CARD},b.status,b.license_note AS licenseNote FROM books b WHERE b.slug=? AND b.status='published'`)
    .bind(slug)
    .first<BookFull>();
}

export async function getChapters(bookId: string): Promise<Chapter[]> {
  const r = await database().prepare("SELECT position,title,body FROM book_chapters WHERE book_id=? ORDER BY position ASC").bind(bookId).all<{ position: number; title: string; body: string }>();
  return r.results.map((c) => ({ position: c.position, title: c.title, paragraphs: splitParagraphs(c.body) }));
}

export type BookInput = { title: string; author: string; year: number | null; description: string; license: License; licenseNote: string; text: string };

function chaptersOrThrow(text: string) {
  const chapters = parseChapters(text);
  if (chapters.length === 0) throw new BookError(400, 'Nenhum capítulo encontrado. Comece cada capítulo com uma linha "# Título".');
  if (chapters.length > 2000) throw new BookError(400, "Capítulos demais (máximo 2000).");
  return chapters;
}

async function replaceChapters(bookId: string, chapters: { title: string; body: string }[]) {
  const db = database();
  await db.batch([
    db.prepare("DELETE FROM book_chapters WHERE book_id=?").bind(bookId),
    ...chapters.map((c, i) => db.prepare("INSERT INTO book_chapters (id,book_id,position,title,body) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), bookId, i + 1, c.title, c.body)),
  ]);
}

export async function createBook(adminId: string, b: BookInput) {
  const chapters = chaptersOrThrow(b.text);
  const db = database();
  const base = slugify(b.title) || "livro";
  let slug = base;
  for (let i = 2; await db.prepare("SELECT 1 AS x FROM books WHERE slug=?").bind(slug).first(); i++) slug = `${base}-${i}`;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO books (id,slug,title,author,year,description,license,license_note,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'draft',?,?,?)")
    .bind(id, slug, b.title, b.author, b.year, b.description, b.license, b.licenseNote, adminId, now, now)
    .run();
  await replaceChapters(id, chapters);
  return { id, slug, chapters: chapters.length };
}

export async function updateBook(id: string, b: BookInput) {
  const chapters = chaptersOrThrow(b.text);
  const db = database();
  const row = await db.prepare("SELECT id FROM books WHERE id=?").bind(id).first();
  if (!row) throw new BookError(404, "Livro não encontrado.");
  await db
    .prepare("UPDATE books SET title=?,author=?,year=?,description=?,license=?,license_note=?,updated_at=? WHERE id=?")
    .bind(b.title, b.author, b.year, b.description, b.license, b.licenseNote, new Date().toISOString(), id)
    .run();
  await replaceChapters(id, chapters);
  return { chapters: chapters.length };
}

export async function setBookStatus(id: string, status: "published" | "draft") {
  const db = database();
  const b = await db.prepare("SELECT id,license,license_note AS licenseNote FROM books WHERE id=?").bind(id).first<{ id: string; license: string; licenseNote: string }>();
  if (!b) throw new BookError(404, "Livro não encontrado.");
  if (status === "published") {
    const n = (await db.prepare("SELECT COUNT(*)::int AS n FROM book_chapters WHERE book_id=?").bind(id).first<{ n: number }>())?.n ?? 0;
    if (n === 0) throw new BookError(409, "O livro precisa ter ao menos um capítulo.");
    if (b.licenseNote.trim().length < 10) throw new BookError(409, "Informe a fonte do texto e da licença antes de publicar.");
  }
  await db.prepare("UPDATE books SET status=?,updated_at=? WHERE id=?").bind(status, new Date().toISOString(), id).run();
}

export type AdminBook = BookFull & { text: string };

export async function listAdminBooks() {
  const r = await database().prepare(`SELECT ${CARD},b.status,b.license_note AS licenseNote FROM books b ORDER BY b.created_at DESC`).all<BookFull>();
  return r.results;
}

/** Texto do livro no formato de edição (# Título + parágrafos), para o admin reeditar. */
export async function bookAsText(id: string) {
  const r = await database().prepare("SELECT title,body FROM book_chapters WHERE book_id=? ORDER BY position ASC").bind(id).all<{ title: string; body: string }>();
  return r.results.map((c) => `# ${c.title}\n\n${c.body}`).join("\n\n");
}

/** Anotações, marcações e progresso do leitor num livro. */
export async function readerState(ownerId: string, bookId: string) {
  const db = database();
  const [notes, marks, progress] = await Promise.all([
    db.prepare("SELECT id,chapter,paragraph,quote,body,tag,created_at AS createdAt FROM book_notes WHERE owner_id=? AND book_id=? ORDER BY created_at DESC").bind(ownerId, bookId).all<{ id: string; chapter: number; paragraph: number; quote: string; body: string; tag: string; createdAt: string }>(),
    db.prepare("SELECT chapter,paragraph FROM book_marks WHERE owner_id=? AND book_id=?").bind(ownerId, bookId).all<{ chapter: number; paragraph: number }>(),
    db.prepare("SELECT chapter,paragraph FROM book_progress WHERE owner_id=? AND book_id=?").bind(ownerId, bookId).first<{ chapter: number; paragraph: number }>(),
  ]);
  return { notes: notes.results, marks: marks.results, progress };
}

async function paragraphOf(bookId: string, chapter: number, paragraph: number) {
  const c = await database()
    .prepare("SELECT c.body,b.status FROM book_chapters c JOIN books b ON b.id=c.book_id WHERE c.book_id=? AND c.position=?")
    .bind(bookId, chapter)
    .first<{ body: string; status: string }>();
  if (!c || c.status !== "published") return null;
  return splitParagraphs(c.body)[paragraph] ?? null;
}

const MAX_NOTES_PER_BOOK = 1000;

/** A citação gravada é sempre o texto do banco: o navegador não escolhe o que vira "citação". */
export async function addNote(ownerId: string, n: { bookId: string; chapter: number; paragraph: number; body: string; tag: string }) {
  const quote = await paragraphOf(n.bookId, n.chapter, n.paragraph);
  if (quote === null) throw new BookError(404, "Trecho não encontrado.");
  const db = database();
  const count = (await db.prepare("SELECT COUNT(*)::int AS n FROM book_notes WHERE owner_id=? AND book_id=?").bind(ownerId, n.bookId).first<{ n: number }>())?.n ?? 0;
  if (count >= MAX_NOTES_PER_BOOK) throw new BookError(409, "Limite de anotações neste livro atingido.");
  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO book_notes (id,owner_id,book_id,chapter,paragraph,quote,body,tag,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .bind(id, ownerId, n.bookId, n.chapter, n.paragraph, quote, n.body, n.tag, new Date().toISOString())
    .run();
  return id;
}

export async function deleteNote(ownerId: string, id: string) {
  const r = await database().prepare("DELETE FROM book_notes WHERE id=? AND owner_id=? RETURNING id").bind(id, ownerId).first();
  if (!r) throw new BookError(404, "Anotação não encontrada.");
}

export async function toggleMark(ownerId: string, bookId: string, chapter: number, paragraph: number) {
  if ((await paragraphOf(bookId, chapter, paragraph)) === null) throw new BookError(404, "Trecho não encontrado.");
  const db = database();
  const del = await db.prepare("DELETE FROM book_marks WHERE owner_id=? AND book_id=? AND chapter=? AND paragraph=? RETURNING chapter").bind(ownerId, bookId, chapter, paragraph).first();
  if (del) return false;
  await db.prepare("INSERT INTO book_marks (owner_id,book_id,chapter,paragraph,created_at) VALUES (?,?,?,?,?)").bind(ownerId, bookId, chapter, paragraph, new Date().toISOString()).run();
  return true;
}

export async function saveProgress(ownerId: string, bookId: string, chapter: number, paragraph: number) {
  if ((await paragraphOf(bookId, chapter, paragraph)) === null) return;
  await database()
    .prepare("INSERT INTO book_progress (owner_id,book_id,chapter,paragraph,updated_at) VALUES (?,?,?,?,?) ON CONFLICT (owner_id,book_id) DO UPDATE SET chapter=excluded.chapter,paragraph=excluded.paragraph,updated_at=excluded.updated_at")
    .bind(ownerId, bookId, chapter, paragraph, new Date().toISOString())
    .run();
}

/** Markdown de citação a partir de uma nota do próprio leitor (ou null). */
export async function citationFor(ownerId: string, noteId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(noteId)) return null;
  const r = await database()
    .prepare(
      `SELECT n.quote,n.chapter,n.paragraph,b.author,b.title,b.slug,c.title AS chapterTitle
       FROM book_notes n JOIN books b ON b.id=n.book_id JOIN book_chapters c ON c.book_id=n.book_id AND c.position=n.chapter
       WHERE n.id=? AND n.owner_id=? AND b.status='published'`,
    )
    .bind(noteId, ownerId)
    .first<{ quote: string; chapter: number; paragraph: number; author: string; title: string; slug: string; chapterTitle: string }>();
  if (!r) return null;
  const origin = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
  return citationMarkdown({ quote: r.quote, author: r.author, title: r.title, chapterTitle: r.chapterTitle, url: `${origin}/livros/${r.slug}?cap=${r.chapter}#p${r.paragraph + 1}` });
}
