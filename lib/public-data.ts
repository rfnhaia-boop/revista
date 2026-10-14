import { database } from "@/lib/storage";

export type PublicQuestion = {
  id: string;
  title: string;
  context: string;
  importance: string;
  status: "published" | "selected";
  createdAt: string;
};

export async function listPublicQuestions(): Promise<PublicQuestion[]> {
  try {
    const { results } = await database()
      .prepare(
        "SELECT id,title,context,importance,status,created_at AS createdAt FROM community_questions WHERE status IN ('published','selected') ORDER BY (status='selected') DESC, created_at DESC LIMIT 50",
      )
      .all<PublicQuestion>();
    return results;
  } catch {
    return [];
  }
}

export type ObservatoryStats = {
  articles: number;
  authors: number;
  notebooks: number;
  questions: number;
  selected: number;
};

/** Somente contagens agregadas de conteúdo já público. */
export async function observatoryStats(): Promise<ObservatoryStats> {
  const zero = { articles: 0, authors: 0, notebooks: 0, questions: 0, selected: 0 };
  try {
    const row = await database()
      .prepare(
        "SELECT (SELECT COUNT(*) FROM articles WHERE status='published') AS articles,(SELECT COUNT(*) FROM profiles) AS authors,(SELECT COUNT(*) FROM notebooks WHERE status='published') AS notebooks,(SELECT COUNT(*) FROM community_questions WHERE status IN ('published','selected')) AS questions,(SELECT COUNT(*) FROM community_questions WHERE status='selected') AS selected",
      )
      .first<ObservatoryStats>();
    return row ?? zero;
  } catch {
    return zero;
  }
}
