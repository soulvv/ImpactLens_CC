"use client";

import React, { useEffect, useState } from "react";
import { FolderPlus, RefreshCw, Search } from "lucide-react";
import { Project } from "@/types";
import { api } from "@/lib/api";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to retrieve project dossiers.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectCreated = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
  };

  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.organization && p.organization.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E2DFD8]">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#224836] font-semibold mb-1">
            Impact Registries
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] uppercase font-mono">
            Project Dossiers
          </h1>
          <p className="text-xs text-[#4B5563] mt-1 max-w-2xl leading-relaxed">
            Registered environmental initiatives, ecological restoration corridors, and carbon monitoring sites.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProjects}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>

          <Button
            variant="sage"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
            New Dossier
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadProjects} className="underline font-semibold ml-4">
            Retry Connection
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white border border-[#E2DFD8] p-3 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dossiers by name, organization, or location..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#F8F7F4] border border-[#E2DFD8] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827]"
          />
        </div>
        <div className="text-xs font-mono text-[#6B7280]">
          Total Dossiers: <span className="font-semibold text-[#111827]">{filteredProjects.length}</span>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-[#E2DFD8] bg-white p-5 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E2DFD8]">
          <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-[#111827]">
            No Project Dossiers Found
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            {search
              ? "No dossiers match your search term. Try a different query or reset your search."
              : "No environmental projects registered yet. Create your first dossier to start linking evidence."}
          </p>
          <div className="mt-4">
            <Button variant="sage" size="sm" onClick={() => setIsModalOpen(true)}>
              <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
              Create Project Dossier
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
