"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Building,
  UploadCloud,
  Film,
  Calendar,
  Layers,
  Sparkles,
  GitCompare,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Project, MediaItem, Comparison, Report } from "@/types";
import { api, getProjectComparisons, getMediaAssetUrl, getProjectReports, regenerateReport, deleteReport } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaGrid } from "@/components/media/media-grid";
import { formatDate } from "@/lib/utils";
import { NewComparisonModal } from "@/components/compare/new-comparison-modal";
import { ReportCard } from "@/components/reports/report-card";
import { ReportGeneratorModal } from "@/components/reports/report-generator-modal";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingComparisons, setLoadingComparisons] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [regeneratingReportId, setRegeneratingReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"media" | "analysis" | "comparison" | "reports">("media");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projRes, mediaRes, compRes, repRes] = await Promise.all([
          api.getProjectById(id),
          api.getProjectMedia(id),
          getProjectComparisons(id).catch(() => []),
          getProjectReports(id).catch(() => []),
        ]);
        setProject(projRes);
        setMediaList(mediaRes);
        setComparisons(compRes);
        setReports(repRes);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to retrieve project dossier.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  const reloadReports = async () => {
    if (!id) return;
    try {
      setLoadingReports(true);
      const res = await getProjectReports(id);
      setReports(res);
    } catch (err) {
      console.error("Failed to reload project reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };


  const reloadComparisons = async () => {
    if (!id) return;
    try {
      setLoadingComparisons(true);
      const res = await getProjectComparisons(id);
      setComparisons(res);
    } catch (err) {
      console.error("Failed to reload project comparisons:", err);
    } finally {
      setLoadingComparisons(false);
    }
  };


  const handleToggleSelect = (mediaId: string) => {
    setSelectedIds((prev) =>
      prev.includes(mediaId) ? prev.filter((i) => i !== mediaId) : [...prev, mediaId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 bg-white border border-[#E2DFD8] text-center space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-[#991B1B]">
          Dossier Not Found
        </h3>
        <p className="text-xs text-[#6B7280]">
          {error || "The requested project dossier could not be located."}
        </p>
        <Link href="/projects">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center text-xs font-mono text-[#6B7280] hover:text-[#111827] transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Projects Registry
        </Link>
      </div>

      {/* Project Dossier Header Card */}
      <div className="p-6 bg-white border border-[#E2DFD8]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant={project.status === "active" ? "sage" : "neutral"} size="md">
                {project.status}
              </Badge>
              <span className="text-xs font-mono text-[#9CA3AF]">
                ID: {project.id}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#111827] font-mono">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs text-[#4B5563] max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-mono text-[#6B7280]">
              {project.location && (
                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#224836]" />
                  <span>{project.location}</span>
                </div>
              )}
              {project.organization && (
                <div className="flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-[#224836]" />
                  <span>{project.organization}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-[#9CA3AF]" />
                <span>Registered: {formatDate(project.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              className="font-mono text-xs border-[#E2DFD8]"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-[#204533]" />
              Generate Report
            </Button>
            <Link href={`/upload?project_id=${project.id}`}>
              <Button variant="sage" size="sm">
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                Upload to Dossier
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dossier Tabs: Phase 1 & Phase 2 Architecture */}
      <div>
        <div className="flex border-b border-[#E2DFD8] bg-[#F4F3F0]">
          <button
            onClick={() => setActiveTab("media")}
            className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center border-b-2 transition-colors ${
              activeTab === "media"
                ? "border-[#111827] bg-white text-[#111827] font-semibold"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <Film className="w-3.5 h-3.5 mr-2" />
            Field Evidence ({mediaList.length})
          </button>

          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center border-b-2 transition-colors ${
              activeTab === "analysis"
                ? "border-[#111827] bg-white text-[#111827] font-semibold"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-2 text-[#224836]" />
            AI Intelligence
            <span className="ml-2 text-[9px] px-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              Phase 2
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("comparison");
              reloadComparisons();
            }}
            className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center border-b-2 transition-colors ${
              activeTab === "comparison"
                ? "border-[#111827] bg-white text-[#111827] font-semibold"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 mr-2 text-[#224836]" />
            Impact Comparisons ({comparisons.length})
            <span className="ml-2 text-[9px] px-1 bg-[#EAF2EC] text-[#204533] border border-[#B8D4C0]">
              Active
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("reports");
              reloadReports();
            }}
            className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wider flex items-center border-b-2 transition-colors ${
              activeTab === "reports"
                ? "border-[#111827] bg-white text-[#111827] font-semibold"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 mr-2 text-[#224836]" />
            Impact Reports ({reports.length})
            <span className="ml-2 text-[9px] px-1 bg-[#EAF2EC] text-[#204533] border border-[#B8D4C0]">
              Active
            </span>
          </button>
        </div>


        {/* Tab 1: Field Evidence Media (Active Phase 1) */}
        {activeTab === "media" && (
          <div className="pt-6">
            {mediaList.length === 0 ? (
              <div className="p-10 text-center bg-white border border-[#E2DFD8]">
                <Film className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#111827]">
                  No Field Media Uploaded to this Dossier
                </h4>
                <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                  Photographic surveys and drone video records uploaded to this project will be indexed here.
                </p>
                <div className="mt-4">
                  <Link href={`/upload?project_id=${project.id}`}>
                    <Button variant="sage" size="sm">
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                      Upload First Asset
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <MediaGrid
                items={mediaList}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            )}
          </div>
        )}

        {/* Tab 2: AI Intelligence Extension Placeholder */}
        {activeTab === "analysis" && (
          <div className="p-8 bg-white border border-[#E2DFD8] mt-6 space-y-4">
            <div className="flex items-center space-x-2 text-[#224836]">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-[#111827]">
                Multimodal Environmental AI Engine
              </h3>
            </div>
            <p className="text-xs text-[#4B5563] max-w-2xl leading-relaxed">
              Automated deep vision analysis for <strong>{project.name}</strong>, including canopy coverage percentage, vegetative health indices (NDVI/multispectral), and biomass change quantification.
            </p>
            <div className="p-4 bg-[#F8F7F4] border border-[#E2DFD8] text-xs font-mono text-[#6B7280]">
              Status: Multimodal Vision active across Media Library and Comparison Engine.
            </div>
          </div>
        )}

        {/* Tab 3: Before / After Impact Intelligence (Live Phase 3) */}
        {activeTab === "comparison" && (
          <div className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-[#E2DFD8]">
              <div>
                <h3 className="font-serif text-base font-semibold text-[#111827]">
                  Before / After Impact Evidence
                </h3>
                <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                  Verified temporal comparisons demonstrating visible change for {project.name}.
                </p>
              </div>

              <Button
                variant="sage"
                size="sm"
                onClick={() => setIsComparisonModalOpen(true)}
                className="gap-1.5 font-mono uppercase text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Comparison</span>
              </Button>
            </div>

            {loadingComparisons ? (
              <div className="p-12 text-center bg-white border border-[#E2DFD8] text-xs font-mono text-[#6B7280]">
                Loading dossier comparisons...
              </div>
            ) : comparisons.length === 0 ? (
              <div className="p-10 text-center bg-white border border-dashed border-[#E2DFD8] space-y-3">
                <GitCompare className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#111827]">
                  No Impact Comparisons Created Yet
                </h4>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  Compare two field surveys from this project to synthesize visible environmental transformation.
                </p>
                <div className="pt-2">
                  <Button
                    variant="sage"
                    size="sm"
                    onClick={() => setIsComparisonModalOpen(true)}
                    className="gap-1.5 font-mono uppercase text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Comparison</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisons.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-[#E2DFD8] p-4 flex flex-col justify-between hover:border-[#111827] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#204533] font-semibold bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
                          {c.project_name || project.name}
                        </span>
                        <Badge variant={c.status === "READY" ? "sage" : "amber"} size="sm">
                          {c.status}
                        </Badge>
                      </div>

                      {/* Dual Thumbnails */}
                      <div className="grid grid-cols-2 gap-2 my-2 bg-neutral-900 border border-[#E2DFD8] p-1 overflow-hidden">
                        <div className="aspect-video relative overflow-hidden bg-neutral-800">
                          <img
                            src={getMediaAssetUrl(c.before_media?.secure_url)}
                            alt="Baseline"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 left-0 bg-black/80 text-[8px] font-mono uppercase text-white px-1">
                            Before
                          </span>
                        </div>
                        <div className="aspect-video relative overflow-hidden bg-neutral-800">
                          <img
                            src={getMediaAssetUrl(c.after_media?.secure_url)}
                            alt="Subsequent"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-[#204533]/90 text-[8px] font-mono uppercase text-white px-1">
                            After
                          </span>
                        </div>
                      </div>

                      <h4 className="font-serif text-sm font-semibold text-[#111827] line-clamp-1 mt-2">
                        {c.title || c.overall_change || "Field Comparison"}
                      </h4>

                      <p className="text-xs text-[#4B5563] line-clamp-2 mt-1 leading-relaxed">
                        {c.comparison_summary || "Visual change detection ready."}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#E2DFD8] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#6B7280]">
                        {formatDate(c.before_media?.created_at)} → {formatDate(c.after_media?.created_at)}
                      </span>
                      <Link
                        href={`/compare?id=${c.id}`}
                        className="text-[#204533] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Open Workspace <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Impact Reports (Live Phase 4) */}
        {activeTab === "reports" && (
          <div className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-[#E2DFD8]">
              <div>
                <h3 className="font-serif text-base font-semibold text-[#111827]">
                  Impact Reports & Verification Stories
                </h3>
                <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                  Evidence-backed editorial dossiers synthesized from {mediaList.length} field assets and {comparisons.length} comparisons.
                </p>
              </div>

              <Button
                variant="sage"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                className="gap-1.5 font-mono uppercase text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Generate Report</span>
              </Button>
            </div>

            {loadingReports ? (
              <div className="p-12 text-center bg-white border border-[#E2DFD8] text-xs font-mono text-[#6B7280]">
                Loading dossier reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center bg-white border border-dashed border-[#E2DFD8] space-y-3">
                <FileText className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#111827]">
                  No Impact Reports Generated Yet
                </h4>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto font-sans">
                  Generate an auditable impact report aggregating all field photos, drone footage, and visual changes for {project.name}.
                </p>
                <div className="pt-2">
                  <Button
                    variant="sage"
                    size="sm"
                    onClick={() => setIsReportModalOpen(true)}
                    className="gap-1.5 font-mono uppercase text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate First Report</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((r) => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    onRegenerate={async (repId) => {
                      try {
                        setRegeneratingReportId(repId);
                        await regenerateReport(repId);
                        await reloadReports();
                      } catch (err: any) {
                        alert(`Regeneration failed: ${err.message || err}`);
                      } finally {
                        setRegeneratingReportId(null);
                      }
                    }}
                    onDelete={async (repId) => {
                      try {
                        await deleteReport(repId);
                        setReports((prev) => prev.filter((item) => item.id !== repId));
                      } catch (err: any) {
                        alert(`Deletion failed: ${err.message || err}`);
                      }
                    }}
                    isRegenerating={regeneratingReportId === r.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for creating a new comparison for this project */}
      <NewComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        initialProjectId={project.id}
        onComparisonCreated={(newC) => {
          setComparisons((prev) => [newC, ...prev]);
          router.push(`/compare?id=${newC.id}`);
        }}
      />

      {/* Modal for generating a new report for this project */}
      <ReportGeneratorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultProjectId={project.id}
        onReportCreated={() => {
          reloadReports();
        }}
      />
    </div>
  );
}


