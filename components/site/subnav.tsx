"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubNav({ staff, money }: { staff: boolean; money: boolean }) {
  const path = usePathname();
  const links = [
    ["/minha-new", "Minha NEW"],
    ["/caderno", "Meu Caderno"],
    ["/projetos", "Projetos"],
    ...(money ? [["/apoiador", "Área do apoiador"]] : []),
    ["/research", "Perguntas públicas"],
    ["/observatorio", "Observatório"],
    ...(staff ? [["/admin", "Gestão"]] : []),
  ];
  return (
    <nav className="network-subnav" aria-label="Áreas da plataforma">
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={path === href || path.startsWith(href + "/") ? "page" : undefined} className={path === href || path.startsWith(href + "/") ? "active" : ""}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
