import { requireStaffPage } from "@/lib/admin";
import SubmissionsPanel from "./panel";

export default async function Page() {
  await requireStaffPage();
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">EDITORIAL</div>
          <h1>Envios</h1>
          <p>Trabalhos recebidos. Aceitar um envio não emite selo nem publica automaticamente.</p>
        </div>
      </header>
      <SubmissionsPanel />
    </>
  );
}
