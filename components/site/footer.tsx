import Link from "next/link";

export default function SiteFooter({ money, staff }: { money: boolean; staff: boolean }) {
  return (
    <footer>
      <div className="footer-top">
        <Link className="wordmark" href="/">
          Revista NEW<span className="wordmark-dot">.</span>
        </Link>
        <p>
          Transformar curiosidade em pesquisa.
          <br />
          Pesquisa em conhecimento. Conhecimento em oportunidade.
        </p>
        <div>
          <a href="https://new-company.dricapillica.chatgpt.site/">Conheça a NEW Company ↗</a>
          {money && <Link href="/apoie">Apoie a NEW</Link>}
          <Link href="/explorar">Comunidade e Cadernos</Link>
          <Link href="/selos">Selos NEW</Link>
          <Link href="/protocolo">Protocolo e transparência</Link>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/privacidade">Política de Privacidade</Link>
          {staff && <Link href="/admin">Gestão editorial</Link>}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 NEW Company</span>
        <span>Edição zero · Plataforma em desenvolvimento</span>
        <span>Brasil</span>
      </div>
    </footer>
  );
}
