import { Toaster } from "sonner";
import "../escrever/editor.css";
import "./perfil.css";

export const metadata = { title: "Meu perfil · Revista NEW", robots: { index: false, follow: false } };

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster theme="dark" richColors />
      {children}
    </>
  );
}
