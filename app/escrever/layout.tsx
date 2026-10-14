import { Toaster } from "sonner";
import "./editor.css";

export const metadata = { title: "Escrever artigo · Revista NEW", robots: { index: false, follow: false } };

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster theme="dark" richColors />
      {children}
    </>
  );
}
