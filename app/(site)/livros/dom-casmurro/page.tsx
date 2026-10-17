import type { Metadata } from "next";
import InteractiveReader from "./reader";

export const metadata: Metadata = {
  title: "Dom Casmurro · Leitura interativa NEW",
  description: "Leia, marque e organize ideias em uma edição interativa da Revista NEW.",
};

export default function Page() { return <InteractiveReader />; }
