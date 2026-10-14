import { notFound } from "next/navigation";
import SupportNEW from "@/app/support";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Apoie a NEW · Revista NEW" };

export default function Page() {
  if (!moneyEnabled()) notFound();
  return <SupportNEW />;
}
