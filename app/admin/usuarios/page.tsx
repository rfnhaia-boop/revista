import { requireStaffPage } from "@/lib/admin";
import UsersPanel from "./panel";

export default async function Page() {
  await requireStaffPage(true);
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">ACESSO</div>
          <h1>Usuários</h1>
          <p>Papéis: membro escreve rascunhos; criador publica; pesquisador abre fluxos científicos; editorial cuida da revista.</p>
        </div>
      </header>
      <UsersPanel />
    </>
  );
}
