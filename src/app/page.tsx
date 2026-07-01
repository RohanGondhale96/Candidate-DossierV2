import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "VENDOR") redirect("/vendor/jobs");
  redirect("/client/jobs");
}
