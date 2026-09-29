"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Calendar, Clock, GitCompare, Layers, ExternalLink, RefreshCw, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Report } from "@/types";

interface ReportCardProps {
  report: Report;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
  isRegenerating?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onRegenerate,
  onDelete,
  isRegenerating = false,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#EAF2EC] text-[#204533] border border-[#B8D4C0] text-[10px] font-mono font-semibold uppercase">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready</span>
          </span>
        );
      case "generating":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-mono font-semibold uppercase animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Generating</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono font-semibold uppercase">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#F1EFEA] text-[#4B5563] border border-[#E2DFD8] text-[10px] font-mono font-semibold uppercase">
            <span>Draft</span>
          </span>
        );
    }
  };

  const formattedDate = new Date(report.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const updatedDate = new Date(report.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-[#E2DFD8] hover:border-[#C8C4BC] transition-all flex flex-col justify-between group">
      <div className="p-5 space-y-3">
        {/* Top Meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 truncate">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#204533] truncate">
              {report.project_name || "Project Report"}
            </span>
            {report.project_location && (
              <span className="text-[10px] text-[#9CA3AF] font-mono truncate">
                • {report.project_location}
              </span>
            )}
          </div>
          <div>{getStatusBadge(report.status)}</div>
        </div>

        {/* Title */}
        <Link href={`/reports/${report.id}`} className="block group-hover:text-[#204533] transition-colors">
          <h3 className="text-base font-bold font-serif text-[#111827] leading-snug line-clamp-2">
            {report.title}
          </h3>
        </Link>

        {/* Overview excerpt */}
        {report.generated_content?.overview && (
          <p className="text-xs text-[#4B5563] font-sans line-clamp-2 leading-relaxed">
            {report.generated_content.overview}
          </p>
        )}

        {/* Evidence & Comparison Counts */}
        <div className="pt-2 border-t border-[#F1EFEA] grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-[#374151]">
            <Layers className="w-3.5 h-3.5 text-[#204533]" />
            <span>{report.evidence_count} media assets</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[#374151]">
            <GitCompare className="w-3.5 h-3.5 text-[#204533]" />
            <span>{report.comparison_count} visual changes</span>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="px-5 py-3 border-t border-[#E2DFD8] bg-[#F8F7F4] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-1 text-[11px] text-[#6B7280]">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center space-x-2">
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(report.id)}
              disabled={isRegenerating || report.status === "generating"}
              className="p-1.5 text-[#6B7280] hover:text-[#204533] hover:bg-[#EAE7DF] transition-colors"
              title="Regenerate Report"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
            </button>
          )}

          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onDelete(report.id)}
                  className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-mono uppercase font-bold"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 text-[#6B7280] text-[10px] font-mono hover:text-[#111827]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-[#EAE7DF] transition-colors"
                title="Delete Report"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}

          <Link
            href={`/reports/${report.id}`}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-[#111827] font-semibold text-xs transition-colors"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
