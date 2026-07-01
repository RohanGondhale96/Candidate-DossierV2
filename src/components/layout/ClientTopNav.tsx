"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export function ClientTopNav() {
  const pathname = usePathname();
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => {
        const jobs: Array<{ pipeline?: { PRESENTED?: number; ACCEPTED?: number; NOT_A_FIT?: number } }> =
          d.jobs ?? [];
        setJobCount(jobs.length);
        const total = jobs.reduce(
          (sum, j) =>
            sum +
            (j.pipeline?.PRESENTED ?? 0) +
            (j.pipeline?.ACCEPTED ?? 0) +
            (j.pipeline?.NOT_A_FIT ?? 0),
          0
        );
        setCandidateCount(total);
      })
      .catch(() => {});
  }, []);

  const NAV = [
    { href: "/client/jobs", label: "Jobs", icon: Briefcase, count: jobCount },
    { href: "/client/candidates", label: "Candidates", icon: Users, count: candidateCount },
  ] as const;

  return (
    <nav className="flex h-10 items-center gap-1">
      {NAV.map(({ href, label, icon: Icon, count }) => {
        const active =
          pathname === href ||
          pathname.startsWith(href + "/") ||
          (href === "/client/candidates" && pathname.startsWith("/client/review"));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count !== null && (
              <span className="text-[12px] font-normal text-muted-foreground">
                ({count})
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
