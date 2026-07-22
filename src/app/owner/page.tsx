import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OwnerOperations from "@/components/owner-operations";
import { OWNER_COOKIE, validOwnerToken } from "@/lib/owner-auth";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE)?.value;
  if (!validOwnerToken(token)) redirect("/owner/login?next=/owner");
  return <OwnerOperations />;
}
