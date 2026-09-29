"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, RefreshCw, FileText, Layers, GitCompare, ShieldCheck } from "lucide-react";
import { getReports, getProjects, regenerateReport, deleteReport } from "@/lib/api";
import { Report, Project } from "@/types";
import { ReportCard } from "@/components/reports/report-card";
import { ReportGeneratorModal } from "@/components/reports/report-generator-modal";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal & Operations
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedProjectId, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reportsData, projectsData] = await Promise.all([
        getReports({
          project_id: selectedProjectId !== "all" ? selectedProjectId : undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
        }),
        getProjects(),
      ]);

      setReports(reportsData);
      setProjects(projectsData);
    } catch (err: any) {
      console.error("Failed to load reports", err);
      setError("Failed to load impact reports. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      setRegeneratingId(id);
      await regenerateReport(id);
      await loadData();
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message || err}`);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message || err}`);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.project_name && r.project_name.toLowerCase().includes(q)) ||
      (r.project_location && r.project_location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E2DFD8]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#204533] mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Reporting & Storytelling Workspace</span>
          </div>
          <h1 className="text-3xl font-bold font-serif text-[#111827] tracking-tight">
            Impact Reports
          </h1>
          <p className="text-sm text-[#6B7280] font-sans mt-1">
            Turn project evidence into clear, traceable impact stories.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData()}
            className="p-2 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-[#6B7280] hover:text-[#111827] transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#204533] hover:bg-[#173326] text-white text-xs font-mono font-semibold tracking-wide transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E2DFD8] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search reports by title or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E2DFD8] text-xs font-sans text-[#111827] focus:outline-none focus:border-[#204533]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Project Filter */}
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#6B7280]">
            <Filter className="w-3.5 h-3.5 text-[#9CA3AF]" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF9F6] border border-[#E2DFD8] text-xs font-mono text-[#111827] focus:outline-none focus:border-[#204533]"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#6B7280]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-[#FAF9F6] border border-[#E2DFD8] text-xs font-mono text-[#111827] focus:outline-none focus:border-[#204533]"
            >
              <option value="all">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="generating">Generating</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 bg-white border border-[#E2DFD8] animate-pulse p-6 space-y-4"
            >
              <div className="h-4 bg-[#F1EFEA] w-1/3" />
              <div className="h-6 bg-[#F1EFEA] w-3/4" />
              <div className="h-16 bg-[#F1EFEA] w-full" />
              <div className="h-8 bg-[#F1EFEA] w-1/2 pt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white border border-red-200 text-red-700 text-xs font-mono space-y-2">
          <p>{error}</p>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-white border border-red-300 text-red-800 hover:bg-red-50 text-xs font-mono uppercase"
          >
            Retry
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#E2DFD8] space-y-4">
          <div className="w-12 h-12 bg-[#F1EFEA] text-[#204533] mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold font-serif text-[#111827]">
              No Impact Reports Found
            </h3>
            <p className="text-xs text-[#6B7280] font-sans max-w-md mx-auto">
              {searchQuery || selectedProjectId !== "all" || selectedStatus !== "all"
                ? "No reports match the selected filters. Try broadening your criteria."
                : "No impact reports have been created yet. Generate your first evidence-backed report."}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#204533] hover:bg-[#173326] text-white text-xs font-mono font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate First Impact Report</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onRegenerate={handleRegenerate}
              onDelete={handleDelete}
              isRegenerating={regeneratingId === report.id}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ReportGeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultProjectId={selectedProjectId !== "all" ? selectedProjectId : undefined}
        onReportCreated={() => loadData()}
      />
    </div>
  );
}
