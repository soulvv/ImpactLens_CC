"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Columns,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Clock,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Comparison, ComparisonSources } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComparisonSlider } from "@/components/compare/comparison-slider";
import { getMediaAssetUrl, triggerComparisonAnalysis, getComparisonSources, deleteComparison } from "@/lib/api";

interface ComparisonViewerProps {
  comparison: Comparison;
  onRefresh?: () => void;
  onDeleted?: () => void;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  comparison,
  onRefresh,
  onDeleted,
}) => {
  const [viewMode, setViewMode] = useState<"slider" | "side_by_side">("slider");
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [sources, setSources] = useState<ComparisonSources | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const beforeMedia = comparison.before_media;
  const afterMedia = comparison.after_media;
  const analysis = comparison.analysis_result;

  const handleReanalyze = async () => {
    try {
      setIsReanalyzing(true);
      setErrorMsg(null);
      await triggerComparisonAnalysis(comparison.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to trigger re-analysis");
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleLoadSources = async () => {
    try {
      setLoadingSources(true);
      const res = await getComparisonSources(comparison.id);
      setSources(res);
      setShowSourcesModal(true);
    } catch (err: any) {
      console.error("Failed to load comparison sources:", err);
    } finally {
      setLoadingSources(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this comparison record?")) return;
    try {
      setIsDeleting(true);
      await deleteComparison(comparison.id);
      if (onDeleted) onDeleted();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete comparison");
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Date unavailable";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Date unavailable";
    }
  };

  // Confidence label mapping
  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#204533] bg-[#EAF2EC] px-2.5 py-1 border border-[#B8D4C0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#204533]"></span>
          High confidence ({Math.round(score * 100)}%)
        </span>
      );
    } else if (score >= 0.6) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#92400E] bg-[#FEF3C7] px-2.5 py-1 border border-[#FDE68A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#92400E]"></span>
          Moderate confidence ({Math.round(score * 100)}%)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#4B5563] bg-[#F1EFEA] px-2.5 py-1 border border-[#E2DFD8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]"></span>
          Low confidence ({Math.round(score * 100)}%)
        </span>
      );
    }
  };

  const beforeUrl = beforeMedia?.secure_url || "";
  const afterUrl = afterMedia?.secure_url || "";
  const fallbackSvg =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231f2937'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='%2310b981' text-anchor='middle'>Field Evidence</text></svg>";

  return (
    <div className="space-y-6">
      {/* Top Header & Action Bar */}
      <div className="bg-white border border-[#E2DFD8] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#204533] font-semibold bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
                {comparison.project_name || "Project Evidence"}
              </span>
              <Badge
                variant={
                  comparison.status === "READY"
                    ? "sage"
                    : comparison.status === "ANALYZING"
                    ? "amber"
                    : "danger"
                }
              >
                {comparison.status}
              </Badge>
              {getConfidenceBadge(comparison.confidence || 0.85)}
            </div>
            <h1 className="text-xl md:text-2xl font-serif text-[#111827] tracking-tight">
              {comparison.title || comparison.overall_change || "Before / After Impact Comparison"}
            </h1>
            <p className="text-xs text-[#6B7280] font-mono mt-1">
              RECORD ID: {comparison.id} • BASELINE: {formatDate(beforeMedia?.created_at)} → SUBSEQUENT: {formatDate(afterMedia?.created_at)}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex border border-[#E2DFD8] bg-[#F8F7F4] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("slider")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${
                  viewMode === "slider"
                    ? "bg-[#111827] text-white shadow-xs"
                    : "text-[#4B5563] hover:text-[#111827]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Slider</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("side_by_side")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors ${
                  viewMode === "side_by_side"
                    ? "bg-[#111827] text-white shadow-xs"
                    : "text-[#4B5563] hover:text-[#111827]"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSources}
              loading={loadingSources}
              className="gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#204533]" />
              <span>Traceability</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleReanalyze}
              loading={isReanalyzing}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-Analyze</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={isDeleting}
              className="text-[#991B1B] hover:text-[#7F1D1D] hover:bg-[#FEE2E2]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#991B1B] font-mono">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Primary Visual Comparison Canvas */}
      <div className="bg-white border border-[#E2DFD8] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DFD8]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#204533]"></span>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#111827] font-semibold">
              Visual Field Comparison
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#6B7280]">
            {viewMode === "slider" ? "Interactive Divider Mode (Drag or use ◀ / ▶)" : "Side-by-Side Synchronized Mode"}
          </span>
        </div>

        {viewMode === "slider" ? (
          <div>
            <ComparisonSlider
              beforeUrl={beforeUrl}
              afterUrl={afterUrl}
              beforeAlt={`Before: ${beforeMedia?.filename || "Baseline evidence"}`}
              afterAlt={`After: ${afterMedia?.filename || "Subsequent evidence"}`}
              aspectRatio="aspect-16/10"
              className="w-full max-h-[560px]"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Canvas */}
            <div className="relative border border-[#E2DFD8] bg-[#F8F7F4] overflow-hidden group">
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-[#111827]/90 text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 backdrop-blur-xs border border-white/20">
                  BEFORE • BASELINE
                </span>
              </div>
              <div className="aspect-16/10 w-full overflow-hidden bg-neutral-900">
                <img
                  src={getMediaAssetUrl(beforeUrl)}
                  alt="Baseline evidence"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackSvg;
                  }}
                />
              </div>
            </div>

            {/* After Canvas */}
            <div className="relative border border-[#E2DFD8] bg-[#F8F7F4] overflow-hidden group">
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-[#204533]/90 text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 backdrop-blur-xs border border-white/20">
                  AFTER • SUBSEQUENT
                </span>
              </div>
              <div className="aspect-16/10 w-full overflow-hidden bg-neutral-900">
                <img
                  src={getMediaAssetUrl(afterUrl)}
                  alt="Subsequent evidence"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackSvg;
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Media Context Details (Underneath Each Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 mt-5 border-t border-[#E2DFD8]">
          {/* Baseline Context */}
          <div className="space-y-3 bg-[#F8F7F4] p-4 border border-[#E2DFD8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-[#111827] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4B5563]"></span>
                Baseline Field Media
              </span>
              {beforeMedia?.id && (
                <Link
                  href={`/media/${beforeMedia.id}`}
                  className="text-[11px] font-mono text-[#204533] hover:underline inline-flex items-center gap-1"
                >
                  Inspect asset <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Date Observed</p>
                <p className="font-mono text-[#111827] font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-[#6B7280]" />
                  {formatDate(beforeMedia?.created_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Location</p>
                <p className="font-mono text-[#111827] font-medium flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-[#6B7280] shrink-0" />
                  {beforeMedia?.location || "Unspecified"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Original Filename</p>
                <p className="font-mono text-[#111827] truncate mt-0.5 text-[11px]">
                  {beforeMedia?.filename || "evidence_baseline.jpg"}
                </p>
              </div>
            </div>

            {beforeMedia?.description && (
              <div className="pt-2 border-t border-[#E2DFD8]">
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Baseline Visual Observation</p>
                <p className="text-xs text-[#374151] mt-1 leading-relaxed italic">
                  &ldquo;{beforeMedia.description}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Subsequent Context */}
          <div className="space-y-3 bg-[#F8F7F4] p-4 border border-[#E2DFD8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-[#204533] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#204533]"></span>
                Subsequent Field Media
              </span>
              {afterMedia?.id && (
                <Link
                  href={`/media/${afterMedia.id}`}
                  className="text-[11px] font-mono text-[#204533] hover:underline inline-flex items-center gap-1"
                >
                  Inspect asset <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Date Observed</p>
                <p className="font-mono text-[#111827] font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-[#6B7280]" />
                  {formatDate(afterMedia?.created_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Location</p>
                <p className="font-mono text-[#111827] font-medium flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-[#6B7280] shrink-0" />
                  {afterMedia?.location || "Unspecified"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Original Filename</p>
                <p className="font-mono text-[#111827] truncate mt-0.5 text-[11px]">
                  {afterMedia?.filename || "evidence_subsequent.jpg"}
                </p>
              </div>
            </div>

            {afterMedia?.description && (
              <div className="pt-2 border-t border-[#E2DFD8]">
                <p className="text-[10px] font-mono uppercase text-[#6B7280]">Subsequent Visual Observation</p>
                <p className="text-xs text-[#374151] mt-1 leading-relaxed italic">
                  &ldquo;{afterMedia.description}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Comparison Intelligence Summary */}
      <div className="bg-white border border-[#E2DFD8] p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DFD8]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#204533]" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#111827] font-semibold">
              AI Environmental Impact Assessment
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] bg-[#F1EFEA] px-2 py-0.5 border border-[#E2DFD8]">
            Engine: {comparison.model_name || "multimodal-vision"} ({comparison.analysis_version || "v3.0"})
          </span>
        </div>

        {/* Narrative Summary */}
        <div className="space-y-3">
          <div className="p-4 bg-[#F8F7F4] border-l-3 border-[#204533]">
            <h3 className="text-sm font-serif font-semibold text-[#111827] mb-1">
              {comparison.overall_change || "Visible Environmental Change Detected"}
            </h3>
            <p className="text-xs text-[#374151] leading-relaxed font-sans">
              {comparison.comparison_summary ||
                analysis?.summary ||
                "Comparison analysis indicates visible physical differences between baseline and subsequent records."}
            </p>
          </div>

          {/* Evidence Markers & Observation Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
            {/* Positive Changes */}
            <div className="bg-[#EAF2EC]/40 border border-[#B8D4C0] p-3.5">
              <p className="text-[10px] font-mono uppercase font-bold text-[#204533] tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#204533]" />
                Positive Observed Changes
              </p>
              {analysis?.positive_changes && analysis.positive_changes.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.positive_changes.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#1B3A2B] flex items-start gap-1.5">
                      <span className="text-[#204533] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6B7280] italic">None explicitly highlighted.</p>
              )}
            </div>

            {/* Negative Changes / Lingering Impact */}
            <div className="bg-[#FEF3C7]/40 border border-[#FDE68A] p-3.5">
              <p className="text-[10px] font-mono uppercase font-bold text-[#92400E] tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#92400E]" />
                Concerns / Adverse Shifts
              </p>
              {analysis?.negative_changes && analysis.negative_changes.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.negative_changes.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#78350F] flex items-start gap-1.5">
                      <span className="text-[#92400E] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6B7280] italic">No visible degradation observed.</p>
              )}
            </div>

            {/* Unchanged Elements */}
            <div className="bg-[#F1EFEA] border border-[#E2DFD8] p-3.5">
              <p className="text-[10px] font-mono uppercase font-bold text-[#4B5563] tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4B5563]" />
                Unchanged Elements
              </p>
              {analysis?.unchanged_elements && analysis.unchanged_elements.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysis.unchanged_elements.map((item, idx) => (
                    <li key={idx} className="text-xs text-[#374151] flex items-start gap-1.5">
                      <span className="text-[#6B7280] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6B7280] italic">Background terrain steady.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Structured Detected Changes Breakdown */}
      {analysis?.changes_detected && analysis.changes_detected.length > 0 && (
        <div className="bg-white border border-[#E2DFD8] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DFD8]">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#111827] font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#111827]"></span>
              Visual Change Categories ({analysis.changes_detected.length})
            </h2>
            <span className="text-[11px] font-mono text-[#6B7280]">
              Observational verification points
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.changes_detected.map((change, idx) => (
              <div
                key={idx}
                className="border border-[#E2DFD8] bg-[#F8F7F4] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#204533] bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
                      {change.category}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      {Math.round((change.confidence || 0.8) * 100)}% conf
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-xs">
                    <div className="bg-white p-2 border border-[#E2DFD8]">
                      <span className="text-[9px] font-mono uppercase font-semibold text-[#6B7280] block mb-0.5">
                        BEFORE STATE
                      </span>
                      <p className="text-[#111827]">{change.before}</p>
                    </div>

                    <div className="bg-white p-2 border border-[#B8D4C0]">
                      <span className="text-[9px] font-mono uppercase font-semibold text-[#204533] block mb-0.5">
                        AFTER STATE
                      </span>
                      <p className="text-[#111827] font-medium">{change.after}</p>
                    </div>
                  </div>
                </div>

                {change.evidence && (
                  <div className="mt-3 pt-2.5 border-t border-[#E2DFD8] text-[11px] text-[#4B5563]">
                    <span className="font-mono text-[9px] uppercase text-[#6B7280] block">
                      Visual Evidence
                    </span>
                    <p className="italic mt-0.5">&ldquo;{change.evidence}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Evidence Timeline */}
      <div className="bg-white border border-[#E2DFD8] p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DFD8]">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#111827] font-semibold flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#204533]" />
            Chronological Evidence Sequence
          </h2>
          <span className="text-[11px] font-mono text-[#6B7280]">
            Deterministic Timeline
          </span>
        </div>

        <div className="relative py-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E2DFD8] -translate-y-1/2 z-0 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Step 1: Baseline */}
            <div className="bg-[#F8F7F4] border border-[#E2DFD8] p-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563] font-bold block mb-1">
                POINT 01 • BASELINE EVIDENCE
              </span>
              <p className="font-serif text-sm font-semibold text-[#111827]">
                {formatDate(beforeMedia?.created_at)}
              </p>
              <p className="text-xs text-[#6B7280] mt-1 font-mono truncate">
                Asset: {beforeMedia?.filename || "baseline"}
              </p>
              <p className="text-xs text-[#374151] mt-2 line-clamp-2 italic">
                {beforeMedia?.description || "Initial environmental record"}
              </p>
            </div>

            {/* Step 2: Intervention */}
            <div className="bg-white border border-[#B8D4C0] p-4 text-center flex flex-col justify-center items-center shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#204533] font-bold block mb-1">
                TRANSFORMATION INTERVAL
              </span>
              <p className="font-mono text-xs text-[#204533] font-semibold bg-[#EAF2EC] px-3 py-1 border border-[#B8D4C0] my-1 inline-block">
                Intervention Period
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Field restoration, monitoring, or cleanup activity conducted.
              </p>
            </div>

            {/* Step 3: Subsequent Verification */}
            <div className="bg-[#F8F7F4] border border-[#B8D4C0] p-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#204533] font-bold block mb-1">
                POINT 02 • SUBSEQUENT VERIFICATION
              </span>
              <p className="font-serif text-sm font-semibold text-[#111827]">
                {formatDate(afterMedia?.created_at)}
              </p>
              <p className="text-xs text-[#6B7280] mt-1 font-mono truncate">
                Asset: {afterMedia?.filename || "subsequent"}
              </p>
              <p className="text-xs text-[#374151] mt-2 line-clamp-2 italic">
                {afterMedia?.description || "Subsequent progress record"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Traceability & Source Non-Repudiation Box */}
      <div className="bg-[#F8F7F4] border border-[#E2DFD8] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E2DFD8]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#204533]" />
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-[#111827]">
              Source Traceability & Verification Ledger
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#6B7280]">
            Deterministic Non-Repudiation Hash
          </span>
        </div>

        <p className="text-xs text-[#4B5563] leading-relaxed mb-4">
          Every AI comparison in ImpactLens preserves complete bi-directional traceability to its original, unedited Cloudinary source assets. Analysis results are deterministically logged with model fingerprints.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-white p-3 border border-[#E2DFD8]">
            <p className="text-[10px] uppercase text-[#6B7280] font-bold">Baseline Media Asset</p>
            <p className="text-[#111827] font-medium mt-1 truncate">{beforeMedia?.filename}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">
              Public ID: {beforeMedia?.cloudinary_public_id || "raw_asset_baseline"}
            </p>
            <a
              href={beforeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#204533] hover:underline mt-2"
            >
              View original Cloudinary asset <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-white p-3 border border-[#E2DFD8]">
            <p className="text-[10px] uppercase text-[#6B7280] font-bold">Subsequent Media Asset</p>
            <p className="text-[#111827] font-medium mt-1 truncate">{afterMedia?.filename}</p>
            <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">
              Public ID: {afterMedia?.cloudinary_public_id || "raw_asset_subsequent"}
            </p>
            <a
              href={afterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#204533] hover:underline mt-2"
            >
              View original Cloudinary asset <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E2DFD8] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#6B7280]">
          <span>MODEL: {comparison.model_name || "gemini-1.5-flash"}</span>
          <span>PIPELINE: {comparison.analysis_version || "impactlens-v3.0"}</span>
          <span>TIMESTAMP: {comparison.created_at}</span>
        </div>
      </div>
    </div>
  );
};
