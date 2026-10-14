import { redirect } from "next/navigation";
import ProfileEditor from "./profile-editor";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";
import { slugFromName } from "@/lib/profile-validation";

export const dynamic = "force-dynamic";

type Row = { name: string; slug: string; headline: string; location: string; bio: string; trajectory: string; interests: string; link: string; showSupporters: number | boolean };

export default async function Page({ searchParams }: { searchParams: Promise<{ voltar?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/entrar?return_to=%2Fperfil");
  const p = await database()
    .prepare("SELECT name,slug,headline,location,bio,trajectory,interests,link,show_supporters AS showSupporters FROM profiles WHERE owner_id=?")
    .bind(user.userId)
    .first<Row>();
  const next = sp.voltar === "escrever" ? "/escrever/pensamento" : "/caderno";
  return (
    <ProfileEditor
      next={next}
      initial={{
        exists: !!p,
        name: p?.name ?? user.displayName ?? "",
        slug: p?.slug ?? slugFromName(user.displayName ?? ""),
        headline: p?.headline ?? "",
        location: p?.location ?? "",
        bio: p?.bio ?? "",
        trajectory: p?.trajectory ?? "",
        interests: p?.interests ? p.interests.split(",").map((s) => s.trim()).filter(Boolean) : [],
        link: p?.link ?? "",
        showSupporters: !!p?.showSupporters,
      }}
    />
  );
}
