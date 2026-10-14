import MyNew from "@/app/my-new";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Minha NEW · Revista NEW", robots: { index: false } };

export default async function Page() {
  const user = await getCurrentUser();
  return <MyNew signedIn={!!user} money={moneyEnabled()} />;
}
