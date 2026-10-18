import { requireStaffPage } from "@/lib/admin";
import PaymentsPanel from "./panel";

export default async function Page() {
  await requireStaffPage(true);
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">DINHEIRO</div>
          <h1>Pagamentos</h1>
          <p>Vendas, comissão da NEW, estornos e criadores. O repasse ao criador é feito pelo provedor no ato da venda (split): aqui você acompanha e age.</p>
        </div>
      </header>
      <PaymentsPanel />
    </>
  );
}
