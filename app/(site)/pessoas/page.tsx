import PeopleView from "@/components/community/people-view";
import { getCurrentUser } from "@/lib/auth";
import { listProfiles, myProfileId, userRelations } from "@/lib/community-data";

export const metadata = { title: "Pessoas · Revista NEW", description: "Encontre autores independentes e conheça seus Cadernos." };

export default async function Page() {
  const user = await getCurrentUser();
  const uid = user?.userId ?? "";
  const [people, rel, myId] = await Promise.all([listProfiles(), userRelations(uid), myProfileId(uid)]);
  return <PeopleView people={people} following={rel.following} signedIn={!!user} myId={myId} />;
}
