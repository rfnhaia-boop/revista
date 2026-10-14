import { requireStaffPage } from "@/lib/admin";
import QuestionsPanel from "./panel";

export default async function Page() {
  await requireStaffPage();
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">COMUNIDADE</div>
          <h1>Perguntas</h1>
          <p>Triagem privada: clareza, relevância, segurança e possibilidade de investigação.</p>
        </div>
      </header>
      <QuestionsPanel />
    </>
  );
}
