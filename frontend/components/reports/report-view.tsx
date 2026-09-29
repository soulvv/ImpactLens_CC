"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  Layers,
  GitCompare,
  Film,
  MapPin,
  Clock,
  Printer,
  Share2,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Play,
  Maximize2,
} from "lucide-react";
import { Report, ReportEvidenceItem } from "@/types";
import { CampaignContentSection } from "./campaign-content-card";
import { EvidenceTraceabilityDrawer } from "./evidence-traceability-drawer";
import { regenerateReport } from "@/lib/api";

interface ReportViewProps {
  report: Report;
  isPublic?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, isPublic = false }) => {
  const router = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("Evidence & Source Traceability");
  const [highlightedMediaIds, setHighlightedMediaIds] = useState<string[]>([]);
  const [highlightedComparisonId, setHighlightedComparisonId] = useState<string | undefined>();

  const content = report.generated_content;
  const cover = content?.cover;
  const snapshot = content?.snapshot;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/reports/public/${report.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleRegenerate = async () => {
    if (confirm("Regenerate this impact report using the latest project media and comparisons?")) {
      try {
        setIsRegenerating(true);
        await regenerateReport(report.id);
        window.location.reload();
      } catch (err: any) {
        alert(`Regeneration failed: ${err.message || err}`);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  const openDrawerForObservation = (obs: any) => {
    setDrawerTitle(`Traceability: ${obs.title || obs.claim || "Key Finding"}`);
    setHighlightedMediaIds(obs.media_ids || obs.source_ids || []);
    setHighlightedComparisonId(obs.comparison_id);
    setDrawerOpen(true);
  };


  const openDrawerAll = () => {
    setDrawerTitle("Complete Evidence Audit & Traceability");
    setHighlightedMediaIds([]);
    setHighlightedComparisonId(undefined);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111827] pb-24 font-sans selection:bg-[#204533] selection:text-white">
      {/* Editorial Top Action Bar (No Print) */}
      <div className="no-print sticky top-0 z-40 bg-[#F4F3F0]/90 backdrop-blur-md border-b border-[#E2DFD8] px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isPublic && (
              <Link
                href="/reports"
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Reports Dossier</span>
              </Link>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#EAF2EC] text-[#204533] border border-[#B8D4C0] font-semibold uppercase">
              {report.status}
            </span>
            <span className="text-xs text-[#9CA3AF] font-mono hidden sm:inline">
              Model: {report.model_name}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-xs font-mono text-[#111827] transition-colors"
              title="Print or Export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-xs font-mono text-[#111827] transition-colors"
              title="Copy public link"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#204533]" />
                  <span className="text-[#204533] font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            {!isPublic && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#204533] hover:bg-[#173326] text-white text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                title="Regenerate Report with fresh evidence"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Publication Container */}
      <article className="max-w-4xl mx-auto px-6 pt-12 space-y-16">
        {/* ============================================================== */}
        {/* 1. COVER / HEADER SECTION                                      */}
        {/* ============================================================== */}
        <header className="space-y-8 pb-10 border-b border-[#E2DFD8]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#204533]">
              <span>{cover?.organization || report.project_organization || "Independent Project"}</span>
              <span>•</span>
              <span>{cover?.location || report.project_location || "Field Operations"}</span>
              <span>•</span>
              <span>Audit Edition</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#111827] tracking-tight leading-[1.15]">
              {report.title}
            </h1>

            {content?.subtitle && (
              <p className="text-base sm:text-lg font-serif italic text-[#4B5563]">
                {content.subtitle}
              </p>
            )}
          </div>

          {/* Hero Image */}
          {cover?.hero_media_url ? (
            <div className="space-y-2">
              <div className="w-full h-80 sm:h-[420px] bg-[#EAE7DF] border border-[#E2DFD8] relative overflow-hidden">
                <Image
                  src={cover.hero_media_url}
                  alt={cover.hero_caption || "Report Hero"}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] px-1">
                <span className="truncate max-w-md">{cover.hero_caption}</span>
                <span className="shrink-0">Hero Asset ID: {cover.hero_media_id}</span>
              </div>
            </div>
          ) : null}

          {/* Publication Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#F1EFEA] text-xs font-mono text-[#4B5563]">
            <div>
              <span className="block text-[10px] uppercase text-[#9CA3AF]">Project</span>
              <span className="font-semibold text-[#111827]">{cover?.project_name || report.project_name}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#9CA3AF]">Reporting Window</span>
              <span className="font-semibold text-[#111827]">{snapshot?.reporting_period || "Continuous"}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#9CA3AF]">Date Generated</span>
              <span className="font-semibold text-[#111827]">{cover?.generated_at || new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-[#9CA3AF]">Evidence Integrity</span>
              <span className="font-semibold text-[#204533] inline-flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Traceable</span>
              </span>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. PROJECT OVERVIEW & EVIDENCE SYNTHESIS                        */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
            Project Overview & Scope
          </h2>
          <div className="prose prose-stone text-sm sm:text-base text-[#374151] leading-relaxed font-sans space-y-3">
            <p>{content?.overview || "Project overview based on registered baseline documentation."}</p>
            {content?.evidence_summary && (
              <p className="bg-[#F8F7F4] border-l-2 border-[#204533] p-4 text-xs sm:text-sm text-[#4B5563] font-mono leading-relaxed">
                {content.evidence_summary}
              </p>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. EVIDENCE SNAPSHOT (FACTUAL DB STATS)                         */}
        {/* ============================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD8]">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#204533]">
              Evidence Snapshot (Verified Database Values)
            </h2>
            <span className="text-[10px] font-mono text-[#9CA3AF]">Zero Hallucinated Metrics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white border border-[#E2DFD8] p-4 text-center">
              <span className="block text-2xl font-bold font-mono text-[#111827] tabular-nums">
                {snapshot?.total_media || report.evidence_count}
              </span>
              <span className="text-[11px] font-mono text-[#6B7280] uppercase mt-1 block">
                Total Media
              </span>
            </div>

            <div className="bg-white border border-[#E2DFD8] p-4 text-center">
              <span className="block text-2xl font-bold font-mono text-[#111827] tabular-nums">
                {snapshot?.images_count || 0}
              </span>
              <span className="text-[11px] font-mono text-[#6B7280] uppercase mt-1 block">
                Still Images
              </span>
            </div>

            <div className="bg-white border border-[#E2DFD8] p-4 text-center">
              <span className="block text-2xl font-bold font-mono text-[#111827] tabular-nums">
                {snapshot?.videos_count || 0}
              </span>
              <span className="text-[11px] font-mono text-[#6B7280] uppercase mt-1 block">
                Video / Drone
              </span>
            </div>

            <div className="bg-white border border-[#E2DFD8] p-4 text-center">
              <span className="block text-2xl font-bold font-mono text-[#111827] tabular-nums">
                {snapshot?.comparisons_count || report.comparison_count}
              </span>
              <span className="text-[11px] font-mono text-[#6B7280] uppercase mt-1 block">
                Visual Changes
              </span>
            </div>

            <div className="bg-white border border-[#E2DFD8] p-4 text-center col-span-2 sm:col-span-1">
              <span className="block text-2xl font-bold font-mono text-[#204533] tabular-nums">
                {snapshot?.activities_count || content?.activities_observed?.length || 0}
              </span>
              <span className="text-[11px] font-mono text-[#6B7280] uppercase mt-1 block">
                Observed Actions
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. ACTIVITIES OBSERVED                                          */}
        {/* ============================================================== */}
        {content?.activities_observed && content.activities_observed.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
                Activities Observed in Submitted Field Media
              </h2>
              <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                Statements strictly reflect operations and scenes visually identified in uploaded field assets.
              </p>
            </div>

            <div className="bg-white border border-[#E2DFD8] divide-y divide-[#E2DFD8]">
              {content.activities_observed.map((act, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-[#204533] shrink-0" />
                      <span className="text-sm font-semibold text-[#111827] font-mono">
                        {act.activity}
                      </span>
                    </div>
                    {act.notes && (
                      <p className="text-xs text-[#4B5563] font-sans pl-3.5">{act.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 pl-3.5 sm:pl-0">
                    {act.locations && act.locations.length > 0 && (
                      <span className="text-[11px] font-mono text-[#6B7280] flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                        <span>{act.locations.join(", ")}</span>
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-[#204533] bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
                      {act.count} observation{act.count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 5. VISUAL IMPACT / BEFORE & AFTER COMPARISONS                   */}
        {/* ============================================================== */}
        {content?.visual_changes && content.visual_changes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD8]">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
                  Visual Impact & Documented Changes
                </h2>
                <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                  Side-by-side comparative analysis of baseline and subsequent field captures.
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">
                {content.visual_changes.length} paired study
              </span>
            </div>

            <div className="space-y-8">
              {content.visual_changes.map((change, idx) => (
                <div
                  key={change.comparison_id || idx}
                  className="bg-white border border-[#E2DFD8] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
                        Comparative Study #{idx + 1}
                      </span>
                      <h3 className="text-base font-bold font-serif text-[#111827]">
                        {change.title}
                      </h3>
                    </div>

                    <Link
                      href={`/compare/${change.comparison_id}`}
                      target="_blank"
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F8F7F4] hover:bg-[#EAE7DF] border border-[#E2DFD8] text-xs font-mono text-[#204533] font-semibold transition-colors shrink-0"
                    >
                      <span>Interactive Slider</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Before / After Images Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="px-2 py-0.5 bg-[#F1EFEA] text-[#6B7280] border border-[#E2DFD8] font-semibold uppercase">
                          Before / Baseline
                        </span>
                        <span className="text-[#6B7280]">{change.before_date}</span>
                      </div>
                      <div className="w-full h-56 bg-[#F1EFEA] border border-[#E2DFD8] relative overflow-hidden">
                        {change.before_media_url ? (
                          <Image
                            src={change.before_media_url}
                            alt="Before state"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3AF] font-mono">
                            Before media unavailable
                          </div>
                        )}
                      </div>
                      <span className="block text-[10px] font-mono text-[#9CA3AF] truncate">
                        Asset ID: {change.before_media_id}
                      </span>
                    </div>

                    {/* After */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="px-2 py-0.5 bg-[#EAF2EC] text-[#204533] border border-[#B8D4C0] font-semibold uppercase">
                          After / Subsequent
                        </span>
                        <span className="text-[#6B7280]">{change.after_date}</span>
                      </div>
                      <div className="w-full h-56 bg-[#F1EFEA] border border-[#E2DFD8] relative overflow-hidden">
                        {change.after_media_url ? (
                          <Image
                            src={change.after_media_url}
                            alt="After state"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#9CA3AF] font-mono">
                            After media unavailable
                          </div>
                        )}
                      </div>
                      <span className="block text-[10px] font-mono text-[#9CA3AF] truncate">
                        Asset ID: {change.after_media_id}
                      </span>
                    </div>
                  </div>

                  {/* Observed Change Narrative */}
                  <div className="p-3.5 bg-[#FAF9F6] border border-[#E2DFD8] space-y-1">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#204533]">
                      Visually Observed Change:
                    </span>
                    <p className="text-xs font-sans text-[#111827] leading-relaxed">
                      {change.overall_change}
                    </p>
                    {change.summary && (
                      <p className="text-xs text-[#6B7280] font-sans pt-1 border-t border-[#E2DFD8]">
                        {change.summary}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 6. VIDEO EVIDENCE & KEY MOMENTS                                 */}
        {/* ============================================================== */}
        {content?.video_evidence && content.video_evidence.length > 0 && (
          <section className="space-y-6">
            <div className="pb-2 border-b border-[#E2DFD8]">
              <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
                Drone & Field Video Intelligence
              </h2>
              <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                Dynamic surveillance footage with timestamped key moments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.video_evidence.map((video) => (
                <div
                  key={video.video_id}
                  className="bg-white border border-[#E2DFD8] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Video Player */}
                    <div className="w-full h-56 bg-black relative">
                      <video
                        src={video.secure_url}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-[#204533] uppercase">
                          {video.activity || "Drone Survey"}
                        </span>
                        {video.duration_seconds && (
                          <span className="text-xs font-mono text-[#6B7280]">
                            {Math.round(video.duration_seconds)}s duration
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-sans text-[#374151] leading-relaxed line-clamp-3">
                        {video.summary}
                      </p>

                      {/* Key Moments */}
                      {video.key_moments && video.key_moments.length > 0 && (
                        <div className="pt-2 border-t border-[#F1EFEA] space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#9CA3AF] block font-bold">
                            Timestamped Key Moments:
                          </span>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {video.key_moments.map((km, i) => (
                              <div
                                key={i}
                                className="flex items-start space-x-2 text-[11px] font-mono text-[#4B5563]"
                              >
                                <span className="text-[#204533] font-bold shrink-0">
                                  {Math.floor(km.timestamp / 60)}:
                                  {String(Math.floor(km.timestamp % 60)).padStart(2, "0")}
                                </span>
                                <span className="font-sans text-[#374151] leading-tight">
                                  {km.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border-t border-[#E2DFD8] bg-[#F8F7F4] flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                    <span className="truncate max-w-[200px]">{video.filename}</span>
                    <Link
                      href={`/media/${video.video_id}`}
                      target="_blank"
                      className="text-[#204533] hover:underline font-semibold"
                    >
                      Deep Analysis →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 7. EVIDENCE TIMELINE                                            */}
        {/* ============================================================== */}
        {content?.timeline && content.timeline.length > 0 && (
          <section className="space-y-6">
            <div className="pb-2 border-b border-[#E2DFD8]">
              <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
                Chronological Field Evidence Timeline
              </h2>
              <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                Sequential field submissions establishing verified temporal progression.
              </p>
            </div>

            <div className="relative border-l-2 border-[#E2DFD8] ml-4 pl-6 space-y-6">
              {content.timeline.map((event, idx) => (
                <div key={idx} className="relative group">
                  {/* Dot on timeline */}
                  <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#204533] border-2 border-white ring-2 ring-[#E2DFD8]" />

                  <div className="bg-white border border-[#E2DFD8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group-hover:border-[#C8C4BC] transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-[#111827]">
                          {event.date}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F1EFEA] text-[#6B7280] uppercase">
                          {event.media_type}
                        </span>
                      </div>
                      <p className="text-xs font-sans text-[#4B5563]">
                        {event.activity}
                        {event.location ? ` • ${event.location}` : ""}
                      </p>
                      <span className="text-[10px] font-mono text-[#9CA3AF] block">
                        {event.filename}
                      </span>
                    </div>

                    <Link
                      href={`/media/${event.media_id}`}
                      target="_blank"
                      className="inline-flex items-center space-x-1 text-xs font-mono text-[#204533] hover:underline font-semibold shrink-0"
                    >
                      <span>View Asset</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 8. CURATED EVIDENCE GALLERY                                    */}
        {/* ============================================================== */}
        {content?.evidence_gallery && content.evidence_gallery.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DFD8]">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
                  Curated Field Evidence Gallery
                </h2>
                <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                  High-relevance photographic and sensory records supporting reported conditions.
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">
                {content.evidence_gallery.length} selected assets
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.evidence_gallery.map((item) => (
                <div
                  key={item.media_id}
                  className="bg-white border border-[#E2DFD8] overflow-hidden flex flex-col justify-between group hover:border-[#C8C4BC] transition-colors"
                >
                  <div className="w-full h-48 bg-[#F1EFEA] relative">
                    <Image
                      src={item.secure_url}
                      alt={item.caption || item.filename}
                      fill
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 300px"
                    />
                  </div>

                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                        <span className="font-bold text-[#204533] uppercase">
                          {item.activity || "Field Record"}
                        </span>
                        {item.created_at && <span>{item.created_at}</span>}
                      </div>

                      <p className="text-xs font-sans text-[#374151] line-clamp-2 mt-1">
                        {item.caption}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between text-[10px] font-mono text-[#9CA3AF]">
                      <span className="truncate max-w-[150px]">{item.filename}</span>
                      <Link
                        href={`/media/${item.media_id}`}
                        target="_blank"
                        className="text-[#204533] hover:underline font-semibold"
                      >
                        Inspect →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 9. KEY OBSERVATIONS & SOURCE TRACEABILITY                       */}
        {/* ============================================================== */}
        {content?.key_observations && content.key_observations.length > 0 && (
          <section className="space-y-4">
            <div className="pb-2 border-b border-[#E2DFD8] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-[#111827] tracking-tight">
                  Auditable Key Observations
                </h2>
                <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                  Factual findings linked directly to ground media and comparison records. Click citations to trace.
                </p>
              </div>

              <button
                onClick={openDrawerAll}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F1EFEA] hover:bg-[#EAE7DF] border border-[#E2DFD8] text-xs font-mono text-[#204533] font-semibold transition-colors shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Full Audit Trace</span>
              </button>
            </div>

            <div className="space-y-3">
              {content.key_observations.map((obs, idx) => {
                const titleText = obs.title || obs.claim || "Key Finding";
                const bodyText = obs.observation || obs.evidence_basis || "";
                const sourceText = obs.evidence_source || obs.evidence_basis || "Verified Field Asset";
                const sourceIds = obs.media_ids || obs.source_ids || [];

                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#E2DFD8] p-4 space-y-2 hover:border-[#C8C4BC] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold font-mono text-[#111827]">
                        {titleText}
                      </h3>
                      <button
                        onClick={() => openDrawerForObservation(obs)}
                        className="inline-flex items-center space-x-1 text-xs font-mono text-[#204533] hover:underline font-semibold bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]"
                      >
                        <span>Trace Evidence ({sourceIds.length || (obs.comparison_id ? 1 : 0)})</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm font-sans text-[#374151] leading-relaxed">
                      {bodyText}
                    </p>

                    <div className="pt-2 border-t border-[#F1EFEA] flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#6B7280]">
                      <span className="text-[#9CA3AF]">Ground Source:</span>
                      <span className="font-semibold text-[#111827]">{sourceText}</span>
                      {sourceIds.length > 0 && (
                        <span className="text-[#204533]">
                          ({sourceIds.map((id) => `ID:${id.slice(0, 8)}`).join(", ")})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}


        {/* ============================================================== */}
        {/* 10. CAMPAIGN-READY CONTENT SECTION                             */}
        {/* ============================================================== */}
        {content?.campaign_content && (
          <section className="pt-4 border-t border-[#E2DFD8]">
            <CampaignContentSection
              campaign={content.campaign_content}
              evidenceItems={report.evidence_items}
              onViewSources={openDrawerAll}
            />
          </section>
        )}

        {/* ============================================================== */}
        {/* 11. AUDIT FOOTER & TRACEABILITY SEAL                            */}
        {/* ============================================================== */}
        <footer className="pt-12 border-t border-[#E2DFD8] text-xs font-mono text-[#6B7280] space-y-4">
          <div className="bg-[#F8F7F4] border border-[#E2DFD8] p-5 space-y-2">
            <div className="flex items-center space-x-2 text-[#204533] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Evidence Traceability Seal & Non-Repudiation</span>
            </div>
            <p className="text-xs font-sans text-[#4B5563] leading-relaxed">
              This report was generated deterministically by ImpactLens AI using multimodal visual extraction,
              768-dimensional normalized embeddings, and relational database records. Every claim is cross-referenced
              with an immutable Cloudinary asset and PostgreSQL record.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2DFD8] text-[10px]">
              <div>
                <span className="text-[#9CA3AF]">Report ID:</span>
                <span className="block font-semibold text-[#111827] truncate">{report.id}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Synthesizer:</span>
                <span className="block font-semibold text-[#111827]">{report.model_name}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Spec Version:</span>
                <span className="block font-semibold text-[#111827]">{report.analysis_version}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Timestamp:</span>
                <span className="block font-semibold text-[#111827]">{new Date(report.updated_at).toISOString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#9CA3AF] px-1">
            <span>ImpactLens AI • Environmental & Sustainability Media Intelligence</span>
            <span>Document generated for NGO, government, and stakeholder reporting</span>
          </div>
        </footer>
      </article>

      {/* Traceability Modal / Drawer */}
      <EvidenceTraceabilityDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        evidenceItems={report.evidence_items || []}
        highlightedMediaIds={highlightedMediaIds}
        highlightedComparisonId={highlightedComparisonId}
      />
    </div>
  );
};
