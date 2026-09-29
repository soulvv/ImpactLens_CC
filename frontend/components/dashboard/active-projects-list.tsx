import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ActiveProjectsListProps {
  projects: Project[];
  loading?: boolean;
}

export const ActiveProjectsList: React.FC<ActiveProjectsListProps> = ({
  projects,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-[#E2DFD8] p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-6 bg-white border border-[#E2DFD8] text-center text-xs text-[#6B7280] font-mono">
        No active environmental dossiers registered.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2DFD8] overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 px-4 py-2 bg-[#F8F7F4] border-b border-[#E2DFD8] text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">
        <div className="col-span-5">Project Dossier</div>
        <div className="col-span-4 hidden sm:block">Organization & Biome</div>
        <div className="col-span-2 text-right hidden md:block">Evidence</div>
        <div className="col-span-1 text-right">Inspect</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#F1EFEA]">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="grid grid-cols-12 px-4 py-3 items-center text-xs hover:bg-[#F8F7F4] transition-colors group"
          >
            {/* Project name & status */}
            <div className="col-span-11 sm:col-span-5 pr-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[#111827] group-hover:text-[#204533] font-mono truncate transition-colors">
                  {p.name}
                </span>
                <Badge
                  variant={p.status === "active" ? "sage" : "neutral"}
                  size="sm"
                >
                  {p.status}
                </Badge>
              </div>
              <p className="text-[11px] text-[#6B7280] truncate mt-0.5 max-w-sm">
                {p.description || "Operational environmental monitoring."}
              </p>
            </div>

            {/* Org & Location */}
            <div className="col-span-4 hidden sm:block text-[11px] text-[#4B5563] truncate">
              <div>{p.organization || "Independent Research"}</div>
              <div className="text-[#9CA3AF] text-[10px] font-mono">{p.location || "Global"}</div>
            </div>

            {/* Media count */}
            <div className="col-span-2 text-right hidden md:block font-mono text-xs text-[#204533] font-semibold tabular-nums">
              {p.media_count || 0} assets
            </div>

            {/* Inspect arrow */}
            <div className="col-span-1 text-right flex justify-end">
              <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
