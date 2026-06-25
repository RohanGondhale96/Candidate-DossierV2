import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function VendorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "VENDOR") redirect("/client/dashboard");
  return <>{children}</>;
}
