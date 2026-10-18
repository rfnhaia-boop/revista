import { redirect } from "next/navigation";
import ThoughtEditor from "@/components/editor/thought-editor";
import { getCurrentUser } from "@/lib/auth";
import { citationFor } from "@/lib/books";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Escrever pensamento · Revista NEW" };

export default async function Page({ searchParams }: { searchParams: Promise<{ cite?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?return_to=%2Fescrever%2Fpensamento");
  const profile = await database().prepare("SELECT id FROM profiles WHERE owner_id=?").bind(user.userId).first();
  if (!profile) redirect("/perfil?voltar=escrever");
  const cite = (await searchParams).cite;
  const quote = cite ? await citationFor(user.userId, cite) : null;
  return (
    <ThoughtEditor
      initial={{ id: crypto.randomUUID(), title: "", body: quote ?? "", format: "Pensamento", area: "Filosofia", status: "draft", isNew: true }}
    />
  );
}
