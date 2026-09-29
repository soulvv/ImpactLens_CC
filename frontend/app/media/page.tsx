"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { UploadCloud, RefreshCw } from "lucide-react";
import { MediaItem, Project } from "@/types";
import { api } from "@/lib/api";
import { MediaFilterBar } from "@/components/media/media-filter-bar";
import { MediaGrid } from "@/components/media/media-grid";
import { EmptyMediaState } from "@/components/media/empty-media-state";
import { Button } from "@/components/ui/button";

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mediaRes, projRes] = await Promise.all([
        api.getMedia(),
        api.getProjects(),
      ]);
      setMediaItems(mediaRes);
      setProjects(projRes);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load media records from backend intelligence service.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this field evidence asset? This will also remove the file from remote cloud storage.")) {
      return;
    }

    try {
      await api.deleteMedia(id);
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      alert("Failed to delete media asset: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Filter items in memory
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      // 1. Tab filter
      if (activeTab === "images" && item.media_type !== "image") return false;
      if (activeTab === "videos" && item.media_type !== "video") return false;
      if (activeTab === "processing" && item.status !== "processing" && item.status !== "uploaded")
        return false;
      if (activeTab === "ready" && item.status !== "ready" && item.status !== "verified")
        return false;

      // 2. Project filter
      if (selectedProjectId !== "all" && item.project_id !== selectedProjectId) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.filename.toLowerCase().includes(query);
        const matchProj = (item.project_name || "").toLowerCase().includes(query);
        if (!matchName && !matchProj) return false;
      }

      return true;
    });
  }, [mediaItems, activeTab, selectedProjectId, searchQuery]);

  const hasActiveFilters =
    activeTab !== "all" || selectedProjectId !== "all" || searchQuery.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E2DFD8]">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#224836] font-semibold mb-1">
            Audited Repository
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] uppercase font-mono">
            Media Library
          </h1>
          <p className="text-xs text-[#4B5563] mt-1 max-w-2xl leading-relaxed">
            Centralized field evidence archive for project photos, multispectral drone imagery, and environmental video documentation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>

          <Link href="/upload">
            <Button variant="sage" size="sm" className="font-mono">
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Ingest Media
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-semibold ml-4">
            Retry Connection
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <MediaFilterBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        projects={projects}
        totalCount={filteredItems.length}
      />

      {/* Media Grid or Empty State */}
      {!loading && mediaItems.length === 0 ? (
        <EmptyMediaState />
      ) : !loading && filteredItems.length === 0 ? (
        <EmptyMediaState
          filtered
          onClearFilters={() => {
            setActiveTab("all");
            setSelectedProjectId("all");
            setSearchQuery("");
          }}
        />
      ) : (
        <MediaGrid
          items={filteredItems}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </div>
  );
}
