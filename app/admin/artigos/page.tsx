import { requireStaffPage } from "@/lib/admin";
import ArticlesPanel from "./panel";

export default async function Page({ searchParams }: { searchParams: Promise<{ novo?: string }> }) {
  await requireStaffPage();
  const { novo } = await searchParams;
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">REVISTA</div>
          <h1>Artigos da Revista</h1>
          <p>Escreva, publique e despublique. O que for publicado entra na home, no sitemap e nos buscadores.</p>
        </div>
      </header>
      <ArticlesPanel startNew={novo === "1"} />
    </>
  );
}
