"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, Menu, Search, Users, X } from "lucide-react";
import { toast } from "sonner";

export default function SiteHeader({
  signedIn,
  displayName,
  money,
}: {
  signedIn: boolean;
  displayName: string;
  money: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function dismiss(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    }
    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  useEffect(() => { setOpen(false); }, [path]);
  const links = [
    ["/", "Revista"],
    ["/explorar", "Explorar"],
    ["/pessoas", "Pessoas"],
    ...(money ? [["/marketplace", "Marketplace"]] : []),
    ["/livros", "Livros"],
    ["/selos", "Selos"],
    ["https://new-company.dricapillica.chatgpt.site/", "NEW Company ↗"],
  ];
  const isActive = (href: string) => !href.startsWith("http") && (href === "/" ? path === "/" || path.startsWith("/revista") : path.startsWith(href));

  return (
    <header className="topbar" ref={header}>
      <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
        <span>Revista</span> NEW<span className="wordmark-dot">.</span>
      </Link>
      <nav id="main-navigation" aria-label="Navegação principal" className={open ? "navigation open" : "navigation"}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className={isActive(href) ? "active" : ""} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="nav-actions">
        {money && (
          <Link href="/apoie" className="primary small nav-support">
            <Heart size={14} /> Apoie a NEW
          </Link>
        )}
        <Link href="/#search" className="iconbutton searchnav" aria-label="Pesquisar artigos" onClick={() => setOpen(false)}>
          <Search size={19} />
        </Link>
        {signedIn ? (
          <Link href="/minha-new" className="outline small">
            <Users size={15} />
            <span>{displayName}</span>
          </Link>
        ) : (
          <Link href="/entrar" className="outline small">
            <Users size={15} />
            <span>Entrar</span>
          </Link>
        )}
        {signedIn && (
          <button
            className="iconbutton"
            aria-label="Sair da conta"
            title="Sair"
            onClick={async () => {
              try {
                const response = await fetch("/api/auth/logout", { method: "POST" });
                if (!response.ok) throw new Error();
                setOpen(false);
                router.push("/");
                router.refresh();
              } catch { toast.error("Não foi possível sair. Tente novamente."); }
            }}
          >
            <LogOut size={18} />
          </button>
        )}
        <button ref={toggle} className="iconbutton mobile-toggle" aria-controls="main-navigation" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
