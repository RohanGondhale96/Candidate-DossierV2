"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export function VendorTopNav() {
  const pathname = usePathname();
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobCount(d.jobs?.length ?? null))
      .catch(() => {});
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((d) => setCandidateCount(d.cards?.length ?? null))
      .catch(() => {});
  }, []);

  const NAV = [
    { href: "/vendor/jobs", label: "Jobs", icon: Briefcase, count: jobCount },
    { href: "/vendor/candidates", label: "Candidates", icon: Users, count: candidateCount },
  ] as const;

  return (
    <nav className="flex h-10 items-center gap-1">
      {NAV.map(({ href, label, icon: Icon, count }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
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
