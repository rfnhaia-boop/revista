import { redirect } from "next/navigation";
import ThoughtEditor from "@/components/editor/thought-editor";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Escrever pensamento · Revista NEW" };

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?return_to=%2Fescrever%2Fpensamento");
  const profile = await database().prepare("SELECT id FROM profiles WHERE owner_id=?").bind(user.userId).first();
  if (!profile) redirect("/caderno?perfil=1");
  return (
    <ThoughtEditor
      initial={{ id: crypto.randomUUID(), title: "", body: "", format: "Pensamento", area: "Filosofia", status: "draft", isNew: true }}
    />
  );
}
