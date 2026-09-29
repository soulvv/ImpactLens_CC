"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Loader2, Calendar, FileText, CheckSquare, Layers } from "lucide-react";
import { createReport, getProjects } from "@/lib/api";
import { Project } from "@/types";

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onReportCreated?: (reportId: string) => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  onReportCreated,
}) => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || "");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [includeVideos, setIncludeVideos] = useState<boolean>(true);
  const [includeComparisons, setIncludeComparisons] = useState<boolean>(true);

  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      if (defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
      }
    }
  }, [isOpen, defaultProjectId]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects();
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load projects", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a target project.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const payload = {
        project_id: selectedProjectId,
        title: customTitle.trim() ? customTitle.trim() : undefined,
        reporting_period_start: startDate ? new Date(startDate).toISOString() : undefined,
        reporting_period_end: endDate ? new Date(endDate).toISOString() : undefined,
        include_images: includeImages,
        include_videos: includeVideos,
        include_comparisons: includeComparisons,
        sections: [
          "cover",
          "overview",
          "snapshot",
          "activities",
          "visual_changes",
          "video_evidence",
          "timeline",
          "gallery",
          "key_observations",
          "campaign_content",
        ],
      };

      const report = await createReport(payload);

      if (onReportCreated) {
        onReportCreated(report.id);
      }
      onClose();
      router.push(`/reports/${report.id}`);
    } catch (err: any) {
      console.error("Report generation failed", err);
      setError(err.message || "Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-[#E2DFD8] w-full max-w-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DFD8] bg-[#F8F7F4] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-[#204533] flex items-center justify-center text-white shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#111827] font-mono">
                Generate Impact Report
              </h2>
              <p className="text-xs text-[#6B7280] font-sans">
                Synthesize analyzed images, videos, and before/after comparisons into an editorial dossier.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#EAE7DF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-sans">
              {error}
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
              Target Project <span className="text-red-500">*</span>
            </label>
            {loadingProjects ? (
              <div className="h-9 bg-[#F1EFEA] animate-pulse border border-[#E2DFD8]" />
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={generating}
                className="w-full px-3 py-2 bg-white border border-[#E2DFD8] text-sm text-[#111827] focus:outline-none focus:border-[#204533] font-sans"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name} ({proj.media_count || 0} media items) — {proj.location || "Global"}
                  </option>
                ))}
              </select>
            )}
            {selectedProject && (
              <p className="text-[11px] text-[#6B7280] font-mono">
                Organization: {selectedProject.organization || "Independent"} | Status: {selectedProject.status}
              </p>
            )}
          </div>

          {/* Custom Report Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
              Report Title <span className="text-[11px] font-normal text-[#6B7280]">(Optional)</span>
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Q3 Severn Basin Riparian Restoration Progress & Visual Evidence"
              disabled={generating}
              className="w-full px-3 py-2 bg-white border border-[#E2DFD8] text-sm text-[#111827] focus:outline-none focus:border-[#204533] font-sans"
            />
          </div>

          {/* Date Range (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
                Start Date <span className="text-[11px] font-normal text-[#6B7280]">(Optional)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={generating}
                className="w-full px-3 py-1.5 bg-white border border-[#E2DFD8] text-xs text-[#111827] focus:outline-none focus:border-[#204533] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
                End Date <span className="text-[11px] font-normal text-[#6B7280]">(Optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={generating}
                className="w-full px-3 py-1.5 bg-white border border-[#E2DFD8] text-xs text-[#111827] focus:outline-none focus:border-[#204533] font-mono"
              />
            </div>
          </div>

          {/* Evidence Types Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-[#F1EFEA]">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#374151]">
              Included Evidence Types
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center space-x-2 p-2.5 border border-[#E2DFD8] bg-[#F8F7F4] cursor-pointer hover:bg-[#F1EFEA] transition-colors">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  disabled={generating}
                  className="rounded-none text-[#204533] focus:ring-0"
                />
                <span className="text-xs font-mono text-[#111827]">Field Images</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 border border-[#E2DFD8] bg-[#F8F7F4] cursor-pointer hover:bg-[#F1EFEA] transition-colors">
                <input
                  type="checkbox"
                  checked={includeVideos}
                  onChange={(e) => setIncludeVideos(e.target.checked)}
                  disabled={generating}
                  className="rounded-none text-[#204533] focus:ring-0"
                />
                <span className="text-xs font-mono text-[#111827]">Drone Videos</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 border border-[#E2DFD8] bg-[#F8F7F4] cursor-pointer hover:bg-[#F1EFEA] transition-colors">
                <input
                  type="checkbox"
                  checked={includeComparisons}
                  onChange={(e) => setIncludeComparisons(e.target.checked)}
                  disabled={generating}
                  className="rounded-none text-[#204533] focus:ring-0"
                />
                <span className="text-xs font-mono text-[#111827]">Comparisons</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E2DFD8] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#6B7280]">
              AI: Multi-modal grounded synthesis
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={generating}
                className="px-4 py-2 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-xs font-mono text-[#374151] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating || !selectedProjectId}
                className="px-5 py-2 bg-[#204533] hover:bg-[#173326] text-white text-xs font-mono font-semibold tracking-wide transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Aggregating Evidence...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Impact Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
