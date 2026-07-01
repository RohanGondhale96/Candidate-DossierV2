import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { UserMenu } from "@/components/layout/UserMenu";
import { ClientTopNav } from "@/components/layout/ClientTopNav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/vendor/jobs");

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
        <Link href="/client/jobs" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <FileText className="h-4 w-4" />
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Candidate Dossier</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
              Client
            </span>
          </div>
        </Link>
        <UserMenu
          name={user.name ?? "Client"}
          email={user.email ?? ""}
          org={user.organizationName}
        />
      </header>
      <div className="shrink-0 border-b bg-background px-6">
        <ClientTopNav />
      </div>
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
