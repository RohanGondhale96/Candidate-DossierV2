import Link from "next/link";
import { KanbanSquare, Users, FileText } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();

  const [candidateCount, jobCount, resumeCount] = await Promise.all([
    prisma.candidateJob.count({ where: { vendorUserId: user?.id } }),
    prisma.vendorJobAssignment.count({
      where: { vendor: { users: { some: { id: user?.id } } } },
    }),
    prisma.resumeData.count({
      where: { candidateJob: { vendorUserId: user?.id } },
    }),
  ]);

  const stats = [
    { label: "Candidates in pipeline", value: candidateCount, icon: Users },
    { label: "Active roles", value: jobCount, icon: KanbanSquare },
    { label: "Resumes built", value: resumeCount, icon: FileText },
  ];

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back, {user?.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s a snapshot of your candidate pipeline.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-2xl font-semibold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <div className="font-medium">Open your Dossier board</div>
            <div className="text-sm text-muted-foreground">
              Manage candidates across the pipeline and polish their resumes.
            </div>
          </div>
          <Link
            href="/vendor/dossier"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to Dossier
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
