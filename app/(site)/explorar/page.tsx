import ExplorarView from "@/components/community/explorar-view";
import { getCurrentUser } from "@/lib/auth";
import { listArticles, listFeed, listProfiles, myProfileId, userRelations } from "@/lib/community-data";

export const metadata = { title: "Explorar ideias · Revista NEW", description: "Artigos revisados e pensamentos de autores independentes na comunidade da Revista NEW." };

export default async function Page() {
  const user = await getCurrentUser();
  const uid = user?.userId ?? "";
  const [posts, articles, authors, rel, myId] = await Promise.all([listFeed(), listArticles(), listProfiles(100), userRelations(uid), myProfileId(uid)]);
  return <ExplorarView posts={posts} articles={articles} authors={authors} following={rel.following} bookmarks={rel.bookmarks} signedIn={!!user} myId={myId} />;
}
