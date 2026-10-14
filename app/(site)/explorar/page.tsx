import ExplorarView from "@/components/community/explorar-view";
import { getCurrentUser } from "@/lib/auth";
import { listFeed, listProfiles, myProfileId, userRelations } from "@/lib/community-data";

export const metadata = { title: "Explorar ideias · Revista NEW", description: "Descubra pensamentos, textos e autores independentes na comunidade da Revista NEW." };

export default async function Page() {
  const user = await getCurrentUser();
  const uid = user?.userId ?? "";
  const [posts, authors, rel, myId] = await Promise.all([listFeed(), listProfiles(30), userRelations(uid), myProfileId(uid)]);
  return <ExplorarView posts={posts} authors={authors} following={rel.following} bookmarks={rel.bookmarks} signedIn={!!user} myId={myId} />;
}
