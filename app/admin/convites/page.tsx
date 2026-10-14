import { requireStaffPage } from "@/lib/admin";
import InvitesPanel from "./panel";

export default async function Page() {
  await requireStaffPage(true);
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">ACESSO</div>
          <h1>Convites</h1>
          <p>Convide alguém direto para criador ou pesquisador. O convite é individual e vale para um e-mail.</p>
        </div>
      </header>
      <InvitesPanel />
    </>
  );
}
