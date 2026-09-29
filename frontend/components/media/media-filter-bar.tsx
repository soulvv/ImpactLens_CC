import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Project } from "@/types";
import { cn } from "@/lib/utils";

interface MediaFilterBarProps {
  activeTab: string; // 'all' | 'images' | 'videos' | 'processing' | 'ready'
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
  totalCount: number;
}

export const MediaFilterBar: React.FC<MediaFilterBarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedProjectId,
  onProjectChange,
  projects,
  totalCount,
}) => {
  const tabs = [
    { id: "all", label: "All Evidence" },
    { id: "images", label: "Images" },
    { id: "videos", label: "Videos" },
    { id: "processing", label: "Processing" },
    { id: "ready", label: "Ready / Audited" },
  ];

  return (
    <div className="bg-white border border-[#E2DFD8] p-4 space-y-4">
      {/* Top Filter Row: Tabs & Project Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-b md:border-b-0 border-[#F1EFEA] pb-2 md:pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                  isActive
                    ? "bg-[#111827] text-white font-semibold"
                    : "bg-[#F8F7F4] text-[#4B5563] hover:bg-[#EFECE6] hover:text-[#111827]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Project Context Filter */}
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B7280]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#6B7280]">
            Dossier:
          </span>
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            className="h-8 px-2.5 bg-[#F8F7F4] border border-[#E2DFD8] text-xs font-mono text-[#111827] focus:outline-none focus:border-[#111827]"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Search Row */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#F1EFEA]">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by filename or keyword..."
            className="w-full h-8 pl-8 pr-8 text-xs bg-[#F8F7F4] border border-[#E2DFD8] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-[#6B7280] shrink-0">
          Showing <span className="font-semibold text-[#111827]">{totalCount}</span> assets
        </div>
      </div>
    </div>
  );
};
