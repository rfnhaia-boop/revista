import { requireStaffPage } from "@/lib/admin";
import AccessPanel from "./panel";

export default async function Page() {
  await requireStaffPage(true);
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">ACESSO</div>
          <h1>Pedidos de acesso</h1>
          <p>Aprovar um pedido libera publicação (criador) ou fluxos científicos (pesquisador).</p>
        </div>
      </header>
      <AccessPanel />
    </>
  );
}
