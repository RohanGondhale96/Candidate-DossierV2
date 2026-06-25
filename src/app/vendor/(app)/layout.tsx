import Link from "next/link";
import { FileText } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { UserMenu } from "@/components/layout/UserMenu";

export default async function VendorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
        <Link href="/vendor/dossier" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <FileText className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Candidate Dossier</span>
        </Link>
        {user && (
          <UserMenu
            name={user.name ?? "Vendor"}
            email={user.email ?? ""}
            org={user.organizationName}
          />
        )}
      </header>
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
