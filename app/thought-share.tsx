"use client";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export default function ThoughtShare({ id, title }: { id: string; title: string }) {
  async function share() {
    const url = `${window.location.origin}/textos/${id}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado.");
      }
    } catch {
      /* cancelado */
    }
  }
  return (
    <button className="outline small" onClick={() => void share()}>
      <Share2 size={14} /> Compartilhar
    </button>
  );
}
