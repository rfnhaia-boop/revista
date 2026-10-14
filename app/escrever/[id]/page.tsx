import { notFound, redirect } from "next/navigation";
import ArticleEditor from "@/components/editor/article-editor";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";

const LOCKED: Record<string, string> = {
  submitted: "Este artigo foi enviado e está aguardando a equipe. Você poderá editar de novo se pedirmos ajustes.",
  reviewing: "A equipe está revisando este artigo. Você poderá editar de novo se pedirmos ajustes.",
  published: "Este artigo já foi publicado na Revista. Para corrigir algo, fale com a equipe editorial.",
  rejected: "Este artigo não foi aceito para publicação.",
};

type Row = {
  id: string;
  title: string;
  summary: string;
  area: string;
  kind: string;
  authorName: string;
  body: string;
  referencesText: string;
  status: string;
  reviewNote: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?return_to=${encodeURIComponent("/escrever/" + id)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await database()
    .prepare(
      "SELECT id,title,summary,area,kind,author_name AS authorName,body,references_text AS referencesText,status,review_note AS reviewNote FROM articles WHERE id=? AND author_id=?",
    )
    .bind(id, user.userId)
    .first<Row>();
  if (!row) notFound();
  return <ArticleEditor key={row.id} initial={{ ...row, id: row.id }} readOnlyReason={LOCKED[row.status]} />;
}
