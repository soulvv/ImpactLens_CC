"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  SlidersHorizontal, 
  Layers, 
  Sparkles, 
  Mic, 
  CheckCircle2, 
  ArrowUpRight, 
  MapPin, 
  Tag, 
  X,
  RefreshCw,
  Play
} from "lucide-react";
import { api, getMediaAssetUrl } from "@/lib/api";
import { Project, SearchResultItem } from "@/types";
import { AskImpactLens } from "@/components/voice/ask-impactlens";

const PRESET_QUERIES = [
  "Videos of workers cleaning plastic waste near a river",
  "Mangrove restoration in tidal mudflats drone video",
  "River plastic debris cleanup and sorting",
  "Highland pine canopy tree planting",
  "Bifacial solar array inspection",
  "Riparian sediment and turbid water"
];

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [selectedProject, setSelectedProject] = useState(searchParams.get("project_id") || "all");
  const [selectedMediaType, setSelectedMediaType] = useState(searchParams.get("media_type") || "all");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  // Load projects for filter
  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch((err) => console.error("Error loading projects:", err));
  }, []);

  const executeSearch = useCallback(async (searchQuery: string, projId: string, mType: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setActiveQuery(searchQuery);

    try {
      const res = await api.searchMedia({
        query: searchQuery.trim(),
        project_id: projId !== "all" ? projId : undefined,
        media_type: mType !== "all" ? mType : undefined,
        limit: 24
      });
      setResults(res.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with initial URL params
  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery, selectedProject, selectedMediaType);
    } else {
      // Default query on first visit
      executeSearch("environmental conservation evidence", "all", "all");
    }
  }, [initialQuery, executeSearch, selectedProject, selectedMediaType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams();
    params.set("q", query);
    if (selectedProject !== "all") params.set("project_id", selectedProject);
    if (selectedMediaType !== "all") params.set("media_type", selectedMediaType);
    router.push(`/search?${params.toString()}`);
    executeSearch(query, selectedProject, selectedMediaType);
  };

  const handleChipClick = (chipQuery: string) => {
    setQuery(chipQuery);
    const params = new URLSearchParams();
    params.set("q", chipQuery);
    if (selectedProject !== "all") params.set("project_id", selectedProject);
    if (selectedMediaType !== "all") params.set("media_type", selectedMediaType);
    router.push(`/search?${params.toString()}`);
    executeSearch(chipQuery, selectedProject, selectedMediaType);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Title & Voice Launch Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#111827]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#6B7280] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#204533]" />
            <span>AI Semantic Intelligence</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#111827] tracking-tight">
            Find Field Evidence
          </h1>
          <p className="text-sm text-[#4B5563] mt-1 max-w-2xl font-sans">
            Search photographic and visual records using natural language queries, ecological terrain descriptors, or multimodal AI signals.
          </p>
        </div>

        <button
          onClick={() => setVoiceOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111827] text-white rounded font-mono text-xs font-medium hover:bg-[#1E293B] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>Ask ImpactLens (Voice)</span>
        </button>
      </div>

      {/* Semantic Search Box & Filter Panel */}
      <div className="bg-white border border-[#111827]/15 rounded-lg p-5 shadow-xs space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe evidence (e.g. 'mangrove planting in tidal mudflats', 'plastic cleanup', 'acacia saplings')..."
              className="w-full pl-10 pr-10 py-3 bg-[#FBFBFA] border border-[#111827]/20 rounded text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-[#204533] text-white rounded font-mono text-xs font-semibold hover:bg-[#1B3B2B] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Retrieve</span>
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] font-mono text-[#6B7280] uppercase tracking-wider">
            Curated Queries:
          </span>
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleChipClick(preset)}
              className="px-2.5 py-1 bg-[#F8F7F4] border border-[#111827]/10 rounded text-xs font-mono text-[#374151] hover:border-[#111827]/30 hover:bg-[#F3F4F6] transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Facet Filters */}
        <div className="pt-3 border-t border-[#111827]/10 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="font-mono text-[#4B5563] uppercase">Dossier:</span>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                executeSearch(query, e.target.value, selectedMediaType);
              }}
              className="px-2.5 py-1.5 bg-[#F8F7F4] border border-[#111827]/15 rounded font-mono text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
            >
              <option value="all">All Project Dossiers</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[#4B5563] uppercase">Media Type:</span>
            <select
              value={selectedMediaType}
              onChange={(e) => {
                setSelectedMediaType(e.target.value);
                executeSearch(query, selectedProject, e.target.value);
              }}
              className="px-2.5 py-1.5 bg-[#F8F7F4] border border-[#111827]/15 rounded font-mono text-xs text-[#111827] focus:outline-none focus:border-[#111827]"
            >
              <option value="all">All Formats</option>
              <option value="image">Still Images</option>
              <option value="video">Drone & Video</option>
            </select>
          </div>

          {searched && (
            <div className="ml-auto font-mono text-xs text-[#6B7280]">
              Showing <span className="text-[#111827] font-semibold">{results.length}</span> ranked evidence items
            </div>
          )}
        </div>
      </div>

      {/* Results Ledger / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-[#111827]/10 bg-white rounded-lg p-4 space-y-3 animate-pulse">
              <div className="aspect-video bg-neutral-200 rounded" />
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 rounded w-1/2" />
              <div className="h-10 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
            <div
              key={item.media_id}
              className="group border border-[#111827]/15 bg-white rounded-lg overflow-hidden hover:border-[#111827]/50 transition-all shadow-xs flex flex-col"
            >
              {/* Image Preview with Floating Badges */}
              <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                <img
                  src={getMediaAssetUrl(item.thumbnail_url || item.secure_url)}
                  alt={item.filename}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231f2937'/><text x='50%' y='50%' font-family='sans-serif' font-size='22' fill='%2310b981' text-anchor='middle'>Field Evidence Record</text></svg>";
                  }}
                />

                {/* Subtle Play Overlay for Videos */}
                {item.media_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-[#204533] group-hover:scale-110 transition-all border border-white/20 shadow-md">
                      <Play className="w-4 h-4 ml-0.5 fill-current text-white" />
                    </div>
                  </div>
                )}

                {/* Top overlay badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono text-white uppercase backdrop-blur-xs font-semibold ${
                    item.media_type === "video" ? "bg-emerald-950/90 border border-emerald-400/40 text-emerald-300" : "bg-black/75"
                  }`}>
                    {item.media_type === "video" ? "VIDEO" : item.media_type}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/85 text-emerald-300 text-[11px] font-mono font-semibold backdrop-blur-xs border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{Math.round(item.similarity_score * 100)}% Match</span>
                  </div>
                </div>

                {/* Duration Badge for Videos */}
                {item.media_type === "video" && item.duration_seconds && item.duration_seconds > 0 && (
                  <div className="absolute bottom-2 right-2 pointer-events-none">
                    <span className="px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono tabular-nums font-semibold backdrop-blur-xs border border-white/20">
                      ⏱ {formatDuration(item.duration_seconds)}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                    <span className="uppercase tracking-wider truncate max-w-[70%]">
                      {item.project || "Field Evidence"}
                    </span>
                    <span>AI Conf: {Math.round(item.confidence * 100)}%</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#111827] line-clamp-1 group-hover:text-[#204533] transition-colors">
                    {item.activity || item.filename}
                  </h3>

                  {item.location && (
                    <div className="flex items-center gap-1 text-xs text-[#4B5563] font-mono">
                      <MapPin className="w-3 h-3 text-[#6B7280] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  {/* Key Moments Preview if Video */}
                  {item.media_type === "video" && item.key_moments && item.key_moments.length > 0 && (
                    <div className="p-2 bg-[#FAF9F6] border border-[#E2DFD8] rounded text-[11px] font-mono text-[#374151] flex items-center justify-between">
                      <span className="text-[#204533] font-semibold">
                        ⏱ {item.key_moments.length} Key Moments
                      </span>
                      <span className="text-[#6B7280]">
                        {formatDuration(item.key_moments[0].timestamp)} – {formatDuration(item.key_moments[item.key_moments.length - 1].timestamp)}
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-[#4B5563] line-clamp-3 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                {/* AI Tags & Footer Link */}
                <div className="space-y-3 pt-3 border-t border-[#111827]/10">
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#F8F7F4] border border-[#111827]/10 rounded text-[10px] font-mono text-[#4B5563]"
                        >
                          <Tag className="w-2.5 h-2.5 text-[#9CA3AF]" />
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono text-[#9CA3AF]">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-[#9CA3AF]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/media/${item.media_id}`}
                      className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#204533] hover:underline"
                    >
                      <span>Inspect Dossier</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searched ? (
        <div className="p-12 text-center bg-white border border-[#111827]/10 rounded-lg max-w-lg mx-auto">
          <Layers className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#111827]">
            No Matching Field Evidence Found
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            No records match &ldquo;{activeQuery}&rdquo;. Try broader ecological keywords (e.g. &ldquo;planting&rdquo;, &ldquo;water&rdquo;, &ldquo;tree&rdquo;) or clear your project filters.
          </p>
          <button
            onClick={() => handleChipClick("environmental conservation evidence")}
            className="mt-4 px-4 py-2 bg-[#F8F7F4] border border-[#111827]/20 rounded text-xs font-mono font-medium text-[#111827] hover:bg-[#E5E7EB] transition-colors"
          >
            Reset Query
          </button>
        </div>
      ) : null}

      {/* Voice Assistant Modal */}
      <AskImpactLens
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-neutral-500">Loading intelligence engine...</div>}>
      <SearchContent />
    </Suspense>
  );
}
