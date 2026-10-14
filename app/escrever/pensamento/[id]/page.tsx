import { notFound, redirect } from "next/navigation";
import ThoughtEditor from "@/components/editor/thought-editor";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar pensamento · Revista NEW" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?return_to=${encodeURIComponent("/escrever/pensamento/" + id)}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await database()
    .prepare("SELECT id,title,body,format,area,status FROM notebooks WHERE id=? AND owner_id=?")
    .bind(id, user.userId)
    .first<{ id: string; title: string; body: string; format: string; area: string; status: string }>();
  if (!row) notFound();
  return <ThoughtEditor key={row.id} initial={{ ...row, isNew: false }} />;
}
