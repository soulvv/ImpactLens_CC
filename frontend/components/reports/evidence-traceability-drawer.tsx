"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ExternalLink, ShieldCheck, Film, Image as ImageIcon, GitCompare, Clock } from "lucide-react";
import { ReportEvidenceItem } from "@/types";

interface EvidenceTraceabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  evidenceItems: ReportEvidenceItem[];
  highlightedMediaIds?: string[];
  highlightedComparisonId?: string;
}

export const EvidenceTraceabilityDrawer: React.FC<EvidenceTraceabilityDrawerProps> = ({
  isOpen,
  onClose,
  title = "Evidence & Source Traceability",
  subtitle = "All observations in this report are grounded in verified ground assets, timestamps, and model comparisons.",
  evidenceItems,
  highlightedMediaIds = [],
  highlightedComparisonId,
}) => {
  if (!isOpen) return null;

  // Filter or prioritize highlighted items if provided
  const items = evidenceItems.filter((item) => {
    if (highlightedMediaIds.length > 0 && item.media_id) {
      return highlightedMediaIds.includes(item.media_id);
    }
    if (highlightedComparisonId && item.comparison_id) {
      return item.comparison_id === highlightedComparisonId;
    }
    return true;
  });

  const displayList = items.length > 0 ? items : evidenceItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-white border border-[#E2DFD8] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DFD8] flex items-center justify-between bg-[#F8F7F4]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#204533]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#111827] font-mono">
                {title}
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] font-sans">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#EAE7DF] transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Evidence List */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-[#E2DFD8]">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280] font-mono">
              No specific evidence items linked to this observation.
            </div>
          ) : (
            displayList.map((item, idx) => (
              <div key={item.id || idx} className="pt-4 first:pt-0 flex items-start space-x-4">
                {/* Thumbnail / Icon */}
                <div className="w-20 h-16 bg-[#F1EFEA] border border-[#E2DFD8] relative shrink-0 overflow-hidden flex items-center justify-center">
                  {item.media_url ? (
                    item.media_type === "video" ? (
                      <div className="w-full h-full relative group">
                        <video
                          src={item.media_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Film className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={item.media_url}
                        alt={item.media_filename || "Evidence thumbnail"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )
                  ) : item.comparison_id ? (
                    <GitCompare className="w-6 h-6 text-[#204533]" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#9CA3AF]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#204533]/10 text-[#204533] uppercase font-semibold">
                      {item.evidence_role.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-mono text-[#9CA3AF]">
                      Section: {item.section}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#111827] truncate font-mono">
                    {item.media_filename || (item.media_id ? `Media ID: ${item.media_id}` : `Comparison ID: ${item.comparison_id}`)}
                  </p>

                  {item.notes && (
                    <p className="text-xs text-[#4B5563] font-sans leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 pt-1 text-[11px] text-[#6B7280] font-mono">
                    {item.created_at && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </span>
                    )}

                    {item.media_id && (
                      <Link
                        href={`/media/${item.media_id}`}
                        target="_blank"
                        className="inline-flex items-center space-x-1 text-[#204533] hover:underline font-semibold"
                      >
                        <span>Inspect Asset</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}

                    {item.comparison_id && (
                      <Link
                        href={`/compare/${item.comparison_id}`}
                        target="_blank"
                        className="inline-flex items-center space-x-1 text-[#204533] hover:underline font-semibold"
                      >
                        <span>View Comparison</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2DFD8] bg-[#F8F7F4] flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
          <span>{displayList.length} verified evidence source(s) cited</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-[#111827] transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
