import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getChapters, getPublishedBook, readerState } from "@/lib/books";
import { LICENSE_LABEL } from "@/lib/books-core";
import Reader from "./reader";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const book = await getPublishedBook((await params).slug);
  if (!book) return { title: "Livro · Revista NEW", robots: { index: false } };
  return { title: `${book.title} · Leitura interativa NEW`, description: book.description || `Leia ${book.title}, de ${book.author}, numa edição interativa da Revista NEW.` };
}

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ cap?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const book = await getPublishedBook(slug);
  if (!book) notFound();
  const user = await getCurrentUser();
  const chapters = await getChapters(book.id);
  const state = user ? await readerState(user.userId, book.id) : { notes: [], marks: [], progress: null };
  const wanted = Number(sp.cap) || state.progress?.chapter || 1;
  const current = chapters.find((c) => c.position === wanted) ?? chapters[0];
  if (!current) notFound();
  return (
    <Reader
      book={{ id: book.id, slug: book.slug, title: book.title, author: book.author, year: book.year, licenseLabel: LICENSE_LABEL[book.license] }}
      toc={chapters.map((c) => ({ position: c.position, title: c.title }))}
      chapter={current}
      signedIn={!!user}
      initial={{ notes: state.notes, marks: state.marks, startParagraph: state.progress && state.progress.chapter === current.position ? state.progress.paragraph : null }}
    />
  );
}
