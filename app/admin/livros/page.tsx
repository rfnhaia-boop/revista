import { requireStaffPage } from "@/lib/admin";
import BooksPanel from "./panel";

export default async function Page() {
  await requireStaffPage(true);
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">BIBLIOTECA</div>
          <h1>Livros</h1>
          <p>Cadastre o texto com a licença que permite publicá-lo. Só obras em domínio público, licenciadas ou originais da NEW entram na biblioteca.</p>
        </div>
      </header>
      <BooksPanel />
    </>
  );
}
