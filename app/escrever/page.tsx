import { redirect } from "next/navigation";
import ArticleEditor from "@/components/editor/article-editor";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?return_to=%2Fescrever");
  return (
    <ArticleEditor
      initial={{
        id: null,
        title: "",
        summary: "",
        area: "",
        kind: "Ensaio",
        authorName: user.displayName,
        body: "",
        referencesText: "",
        status: "draft",
        reviewNote: "",
      }}
    />
  );
}
