import { redirect } from "next/navigation";
import ArticleEditor from "@/components/editor/article-editor";
import { getCurrentUser } from "@/lib/auth";
import { citationFor } from "@/lib/books";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ cite?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?return_to=%2Fescrever");
  const cite = (await searchParams).cite;
  const quote = cite ? await citationFor(user.userId, cite) : null;
  return (
    <ArticleEditor
      initial={{
        id: null,
        title: "",
        summary: "",
        area: "",
        kind: "Ensaio",
        authorName: user.displayName,
        body: quote ?? "",
        referencesText: "",
        status: "draft",
        reviewNote: "",
      }}
    />
  );
}
