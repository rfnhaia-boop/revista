export const SLUG_RE = /^[a-z][a-z0-9-]{2,39}$/;

/** "Rafael Nhaia" -> "rafael-nhaia" (sem acentos, só a-z 0-9 e hífen, começa com letra). */
export function slugFromName(name: string) {
  let s = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^[0-9-]+/, "");
  if (s.length > 40) s = s.slice(0, 40).replace(/-+$/, "");
  return s;
}

export const INTEREST_SUGGESTIONS = ["Filosofia", "Psicologia", "Tecnologia", "Educação", "Sociedade", "Negócios", "Literatura", "Poesia"];

export type ProfileForm = {
  name: string;
  slug: string;
  headline: string;
  location: string;
  bio: string;
  trajectory: string;
  interests: string[];
  link: string;
};

export const LIMITS = { name: [2, 100], headline: 180, location: 100, bio: [20, 1600], trajectory: 5000, interests: 250, link: 300 } as const;

/** Mesmas regras do servidor (community-validation), para avisar antes de enviar. */
export function profileErrors(f: ProfileForm): Partial<Record<keyof ProfileForm, string>> {
  const e: Partial<Record<keyof ProfileForm, string>> = {};
  const name = f.name.trim();
  if (name.length < LIMITS.name[0]) e.name = "Escreva como você quer ser conhecido.";
  if (!SLUG_RE.test(f.slug)) e.slug = "Use 3 a 40 letras minúsculas, números ou hífen, começando por letra.";
  if (f.bio.trim().length < LIMITS.bio[0]) e.bio = `Conte um pouco mais (mínimo ${LIMITS.bio[0]} caracteres).`;
  if (f.interests.join(", ").length < 2) e.interests = "Escolha ou escreva pelo menos um interesse.";
  if (f.interests.join(", ").length > LIMITS.interests) e.interests = "Interesses demais; remova alguns.";
  if (f.link.trim()) {
    try {
      if (new URL(f.link.trim()).protocol !== "https:") throw new Error();
    } catch {
      e.link = "Use um link completo que comece com https://";
    }
  }
  return e;
}
