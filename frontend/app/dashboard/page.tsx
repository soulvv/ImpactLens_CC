"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw, FolderPlus } from "lucide-react";
import { DashboardData } from "@/types";
import { api } from "@/lib/api";
import { MetricsRow } from "@/components/dashboard/metrics-row";
import { RecentMediaStrip } from "@/components/dashboard/recent-media-strip";
import { ActiveProjectsList } from "@/components/dashboard/active-projects-list";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { QuickUploadCta } from "@/components/dashboard/quick-upload-cta";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardStats();
      setData(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load operational telemetry from intelligence backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header with documentary context */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E2DFD8]">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#204533] font-semibold mb-1">
            Operational Telemetry & Field Ingestion
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827] uppercase font-mono">
            Impact Intelligence
          </h1>
          <p className="text-xs text-[#4B5563] mt-0.5 max-w-2xl leading-relaxed">
            Continuous field verification stream for environmental projects, ecological restoration baselines, and chain-of-custody documentation.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center px-2.5 py-1.5 bg-white border border-[#E2DFD8] text-xs font-mono text-[#374151] hover:text-[#111827] hover:border-[#C8C4BC] transition-colors"
            title="Refresh stream"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </button>
          <Link
            href="/projects"
            className="inline-flex items-center px-3 py-1.5 bg-[#204533] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#173326] transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
            New Dossier
          </Link>
        </div>
      </div>

      {/* Error banner if network/backend failed */}
      {error && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardData}
            className="underline hover:no-underline font-semibold ml-4"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. Unified Overview Metrics Bar */}
      <MetricsRow metrics={data?.metrics} loading={loading} />

      {/* 3. Main Dashboard Layout (Split Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Recent Media & Active Projects */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Field Media */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111827] font-mono">
                  Recent Field Evidence
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Latest photographic surveys and drone sensor telemetry
                </p>
              </div>
              <Link
                href="/media"
                className="text-xs font-mono text-[#204533] hover:underline inline-flex items-center font-semibold"
              >
                Browse All Media <ArrowUpRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <RecentMediaStrip media={data?.recent_media || []} loading={loading} />
          </section>

          {/* Active Projects Table */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111827] font-mono">
                  Active Project Dossiers
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Environmental monitoring programs currently in progress
                </p>
              </div>
              <Link
                href="/projects"
                className="text-xs font-mono text-[#204533] hover:underline inline-flex items-center font-semibold"
              >
                View All Dossiers <ArrowUpRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <ActiveProjectsList
              projects={data?.active_projects || []}
              loading={loading}
            />
          </section>
        </div>

        {/* Right Column (4 cols): Quick Ingestion & Audit Feed */}
        <div className="lg:col-span-4 space-y-6">
          <QuickUploadCta />

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#111827] font-mono">
                Chain of Custody
              </h3>
              <span className="text-[10px] font-mono text-[#6B7280] uppercase">
                Activity Audit Log
              </span>
            </div>
            <RecentActivityFeed
              activities={data?.recent_activity || []}
              loading={loading}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
