"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GitCompare,
  Plus,
  Filter,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Search,
} from "lucide-react";
import { Comparison, Project } from "@/types";
import { getComparisons, getProjects, getMediaAssetUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ComparisonViewer } from "@/components/compare/comparison-viewer";
import { NewComparisonModal } from "@/components/compare/new-comparison-modal";

function ComparisonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeIdParam = searchParams.get("id");

  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<Comparison | null>(null);
  
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedProjectFilter, selectedStatusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [compList, projList] = await Promise.all([
        getComparisons({
          project_id: selectedProjectFilter !== "all" ? selectedProjectFilter : undefined,
          status: selectedStatusFilter !== "all" ? selectedStatusFilter : undefined,
        }),
        getProjects(),
      ]);
      setComparisons(compList);
      setProjects(projList);

      // If activeIdParam specified in URL, auto-select it
      if (activeIdParam) {
        const found = compList.find((c) => c.id === activeIdParam);
        if (found) setSelectedComparison(found);
      } else if (compList.length > 0 && !selectedComparison) {
        // default select the first ready one or top one
        setSelectedComparison(compList[0]);
      }
    } catch (err: any) {
      console.error("Failed to load comparisons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComparison = (comp: Comparison) => {
    setSelectedComparison(comp);
    router.replace(`/compare?id=${comp.id}`, { scroll: false });
  };

  const handleComparisonCreated = (newComp: Comparison) => {
    setComparisons((prev) => [newComp, ...prev]);
    setSelectedComparison(newComp);
    router.replace(`/compare?id=${newComp.id}`, { scroll: false });
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

  const filteredComparisons = comparisons.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.overall_change?.toLowerCase().includes(q) ||
      c.project_name?.toLowerCase().includes(q) ||
      c.comparison_summary?.toLowerCase().includes(q)
    );
  });

  const fallbackSvg =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231f2937'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='%2310b981' text-anchor='middle'>Field Evidence</text></svg>";

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DFD8] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#204533] font-semibold">
              Visual Evidence Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#111827] tracking-tight">
            Impact Comparisons
          </h1>
          <p className="text-sm text-[#4B5563] mt-1 font-sans">
            Compare field evidence over time to understand visible project change.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            className="gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="sage"
            size="md"
            onClick={() => setIsModalOpen(true)}
            className="gap-2 font-mono uppercase text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Comparison</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Content */}
      {selectedComparison ? (
        <div className="space-y-8">
          {/* Active Comparison Viewer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-[#204533] font-bold flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5" />
                Active Evidence Workspace
              </span>
              <button
                onClick={() => setSelectedComparison(null)}
                className="text-xs font-mono text-[#4B5563] hover:text-[#111827] underline"
              >
                Collapse to Table View
              </button>
            </div>

            <ComparisonViewer
              comparison={selectedComparison}
              onRefresh={loadData}
              onDeleted={() => {
                setSelectedComparison(null);
                loadData();
              }}
            />
          </div>

          {/* Recent Comparisons Shelf below the active viewer */}
          <div className="border-t border-[#E2DFD8] pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-serif font-semibold text-[#111827]">
                  All Recorded Comparisons
                </h2>
                <p className="text-xs text-[#6B7280] font-mono">
                  {comparisons.length} verified impact comparisons in repository
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedProjectFilter}
                  onChange={(e) => setSelectedProjectFilter(e.target.value)}
                  className="h-8 px-2.5 bg-white border border-[#E2DFD8] text-xs font-mono text-[#111827] focus:outline-none"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="h-8 px-2.5 bg-white border border-[#E2DFD8] text-xs font-mono text-[#111827] focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="READY">Ready</option>
                  <option value="ANALYZING">Analyzing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Comparisons List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComparisons.map((c) => {
                const isActive = selectedComparison?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectComparison(c)}
                    className={`cursor-pointer border p-4 bg-white transition-all text-left flex flex-col justify-between ${
                      isActive
                        ? "border-[#204533] ring-2 ring-[#204533] shadow-sm"
                        : "border-[#E2DFD8] hover:border-[#111827]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#204533] font-semibold bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
                          {c.project_name || "Project"}
                        </span>
                        <Badge
                          variant={
                            c.status === "READY"
                              ? "sage"
                              : c.status === "ANALYZING"
                              ? "amber"
                              : "danger"
                          }
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </div>

                      {/* Dual Thumbnail Pair */}
                      <div className="grid grid-cols-2 gap-2 my-2 bg-neutral-900 border border-[#E2DFD8] overflow-hidden p-1">
                        <div className="aspect-video relative overflow-hidden bg-neutral-800">
                          <img
                            src={getMediaAssetUrl(c.before_media?.secure_url)}
                            alt="Before"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackSvg;
                            }}
                          />
                          <span className="absolute bottom-0 left-0 bg-black/80 text-[8px] font-mono uppercase text-white px-1">
                            Before
                          </span>
                        </div>
                        <div className="aspect-video relative overflow-hidden bg-neutral-800">
                          <img
                            src={getMediaAssetUrl(c.after_media?.secure_url)}
                            alt="After"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackSvg;
                            }}
                          />
                          <span className="absolute bottom-0 right-0 bg-[#204533]/90 text-[8px] font-mono uppercase text-white px-1">
                            After
                          </span>
                        </div>
                      </div>

                      <h3 className="font-serif text-sm font-semibold text-[#111827] line-clamp-1 mt-2">
                        {c.title || c.overall_change || "Field Comparison"}
                      </h3>

                      <p className="text-xs text-[#4B5563] line-clamp-2 mt-1 leading-relaxed">
                        {c.comparison_summary || "Visual comparison analysis ready."}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#E2DFD8] flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                      <span>
                        {formatDate(c.before_media?.created_at)} → {formatDate(c.after_media?.created_at)}
                      </span>
                      <span className="text-[#204533] font-semibold flex items-center gap-1">
                        Inspect <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="p-12 text-center border border-[#E2DFD8] bg-white text-xs font-mono text-[#6B7280]">
          Loading impact comparisons repository...
        </div>
      ) : comparisons.length === 0 ? (
        /* Empty State */
        <div className="border border-dashed border-[#E2DFD8] bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#EAF2EC] flex items-center justify-center mx-auto text-[#204533]">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-[#111827]">
              No impact comparisons yet.
            </h3>
            <p className="text-xs text-[#4B5563] max-w-md mx-auto mt-1 leading-relaxed">
              Select two pieces of field evidence from the same project to examine visible change over time.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="sage"
              size="md"
              onClick={() => setIsModalOpen(true)}
              className="gap-2 font-mono uppercase text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Comparison</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Table / Grid list when collapsed */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredComparisons.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectComparison(c)}
                className="cursor-pointer border border-[#E2DFD8] p-4 bg-white hover:border-[#111827] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#204533] font-semibold bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
                      {c.project_name || "Project"}
                    </span>
                    <Badge variant={c.status === "READY" ? "sage" : "amber"} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                  <h3 className="font-serif text-sm font-semibold text-[#111827]">
                    {c.title || c.overall_change || "Field Comparison"}
                  </h3>
                  <p className="text-xs text-[#4B5563] line-clamp-2 mt-1">
                    {c.comparison_summary}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#E2DFD8] flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                  <span>
                    {formatDate(c.before_media?.created_at)} → {formatDate(c.after_media?.created_at)}
                  </span>
                  <span className="text-[#204533] font-semibold flex items-center gap-1">
                    View <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Comparison Creation Modal */}
      <NewComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComparisonCreated={handleComparisonCreated}
      />
    </div>
  );
}

export default function ComparisonsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-sm font-mono text-[#6B7280]">Loading comparison workspace...</div>}>
      <ComparisonsContent />
    </React.Suspense>
  );
}
