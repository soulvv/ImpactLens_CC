import React from "react";
import { DashboardMetrics } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsRowProps {
  metrics?: DashboardMetrics;
  loading?: boolean;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2DFD8] border border-[#E2DFD8] bg-white mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Field Media",
      value: metrics.total_media.toLocaleString(),
      subtext: "Photographic & video records",
      accent: "text-[#204533]",
    },
    {
      label: "Active Project Dossiers",
      value: metrics.active_projects.toString(),
      subtext: "Monitored ecosystems",
      accent: "text-[#111827]",
    },
    {
      label: "Processing Queue",
      value: `${metrics.processing_queue} Pending`,
      subtext: "Awaiting analysis pipeline",
      accent: "text-[#92400E]",
    },
    {
      label: "Storage Utilized",
      value: metrics.storage_human,
      subtext: "Media assets & telemetry",
      accent: "text-[#111827]",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E2DFD8] border border-[#E2DFD8] bg-white mb-6">
      {items.map((item, idx) => (
        <div key={idx} className="p-4 flex flex-col justify-between">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
            {item.label}
          </div>

          <div className="my-1.5">
            <div
              className={`text-xl md:text-2xl font-bold font-mono tracking-tight tabular-nums ${item.accent}`}
            >
              {item.value}
            </div>
          </div>

          <div className="text-[11px] text-[#6B7280] font-sans">
            {item.subtext}
          </div>
        </div>
      ))}
    </div>
  );
};
