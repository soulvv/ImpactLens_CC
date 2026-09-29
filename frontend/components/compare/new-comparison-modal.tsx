"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";
import { Project, MediaItem, SuggestedPair, Comparison } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getProjects,
  getProjectMedia,
  getSuggestedPairs,
  createComparison,
  getMediaAssetUrl,
} from "@/lib/api";

interface NewComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComparisonCreated: (newComparison: Comparison) => void;
  initialProjectId?: string;
}

export const NewComparisonModal: React.FC<NewComparisonModalProps> = ({
  isOpen,
  onClose,
  onComparisonCreated,
  initialProjectId,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [projectMedia, setProjectMedia] = useState<MediaItem[]>([]);
  const [suggestedPairs, setSuggestedPairs] = useState<SuggestedPair[]>([]);
  
  const [beforeMedia, setBeforeMedia] = useState<MediaItem | null>(null);
  const [afterMedia, setAfterMedia] = useState<MediaItem | null>(null);
  const [customTitle, setCustomTitle] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Projects on Open
  useEffect(() => {
    if (isOpen) {
      loadProjects();
      if (initialProjectId) {
        setSelectedProjectId(initialProjectId);
      }
    } else {
      // Reset state when modal closes
      setStep(1);
      setBeforeMedia(null);
      setAfterMedia(null);
      setCustomTitle("");
      setErrorMsg(null);
    }
  }, [isOpen, initialProjectId]);

  // Load Media and Suggested Pairs when Project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectEvidence(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await getProjects();
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        const candidate = data.find((p) => (p.media_count || 0) >= 2) || data[0];
        setSelectedProjectId(candidate.id);
      }
    } catch (err: any) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadProjectEvidence = async (projectId: string) => {
    try {
      setLoadingMedia(true);
      setErrorMsg(null);
      const [mediaData, suggestions] = await Promise.all([
        getProjectMedia(projectId),
        getSuggestedPairs(projectId).catch(() => []),
      ]);

      // Only ready/analyzed or available media
      const analyzedMedia = mediaData.filter((m) => m.status === "READY" || m.status === "PROCESSING");
      setProjectMedia(analyzedMedia.length > 0 ? analyzedMedia : mediaData);
      setSuggestedPairs(suggestions);
    } catch (err: any) {
      console.error("Failed to load project media/suggestions:", err);
      setErrorMsg("Failed to load field media for this project.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleApplySuggestedPair = (pair: SuggestedPair) => {
    setBeforeMedia(pair.before_media);
    setAfterMedia(pair.after_media);
    setStep(4); // jump directly to review step
  };

  const handleCreate = async () => {
    if (!selectedProjectId || !beforeMedia || !afterMedia) {
      setErrorMsg("Please select both a baseline (before) and subsequent (after) media asset.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const comparison = await createComparison({
        project_id: selectedProjectId,
        before_media_id: beforeMedia.id,
        after_media_id: afterMedia.id,
        title: customTitle.trim() || undefined,
      });

      onComparisonCreated(comparison);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initiate AI comparison.");
    } finally {
      setIsSubmitting(false);
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

  const fallbackSvg =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231f2937'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='%2310b981' text-anchor='middle'>Field Evidence</text></svg>";

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Impact Comparison"
      subtitle="Synthesize observable project changes between two temporal evidence records."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Step Indicator Header */}
        <div className="grid grid-cols-4 border-b border-[#E2DFD8] pb-3 text-xs font-mono">
          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 cursor-pointer ${
              step >= 1 ? "border-[#204533] text-[#204533] font-bold" : "border-transparent text-[#6B7280]"
            }`}
            onClick={() => setStep(1)}
          >
            <span>01</span>
            <span>Project</span>
          </div>

          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 cursor-pointer ${
              step >= 2 ? "border-[#204533] text-[#204533] font-bold" : "border-transparent text-[#6B7280]"
            }`}
            onClick={() => beforeMedia && setStep(2)}
          >
            <span>02</span>
            <span>Baseline</span>
          </div>

          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 cursor-pointer ${
              step >= 3 ? "border-[#204533] text-[#204533] font-bold" : "border-transparent text-[#6B7280]"
            }`}
            onClick={() => afterMedia && setStep(3)}
          >
            <span>03</span>
            <span>Subsequent</span>
          </div>

          <div
            className={`flex items-center gap-1.5 pb-1 border-b-2 cursor-pointer ${
              step >= 4 ? "border-[#204533] text-[#204533] font-bold" : "border-transparent text-[#6B7280]"
            }`}
            onClick={() => beforeMedia && afterMedia && setStep(4)}
          >
            <span>04</span>
            <span>Review & Run</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] text-xs font-mono text-[#991B1B]">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: SELECT PROJECT */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase font-bold text-[#111827] block mb-1">
                Select Project Dossier
              </label>
              <p className="text-xs text-[#6B7280] mb-3">
                Select the project boundary to retrieve verified chronological media assets.
              </p>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-10 px-3 border border-[#E2DFD8] bg-white text-xs font-mono text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#204533]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.media_count || 0} assets) • {p.location || "Global"}
                  </option>
                ))}
              </select>
            </div>

            {projectMedia.length < 2 && !loadingMedia && (
              <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] text-xs font-mono text-[#92400E] leading-relaxed">
                This project dossier currently contains only {projectMedia.length} analyzed field record. Impact comparison requires at least 2 chronological observations. Select a project with 2+ records (e.g. Severn Basin or Mangrove Delta).
              </div>
            )}

            {/* Smart Pairing Suggestion Box */}
            {suggestedPairs.length > 0 && (
              <div className="bg-[#EAF2EC] border border-[#B8D4C0] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#204533]" />
                    <span className="text-xs font-mono uppercase font-bold text-[#204533]">
                      Smart Pairing Suggestion Available
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#204533] bg-white px-2 py-0.5 border border-[#B8D4C0]">
                    {suggestedPairs[0].confidence_label}
                  </span>
                </div>

                <p className="text-xs text-[#1B3A2B] leading-relaxed">
                  {suggestedPairs[0].reason}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#B8D4C0]/50">
                  <div className="text-[11px] font-mono text-[#204533]">
                    {formatDate(suggestedPairs[0].before_media.created_at)} →{" "}
                    {formatDate(suggestedPairs[0].after_media.created_at)}
                    {suggestedPairs[0].days_apart && ` (${suggestedPairs[0].days_apart} days apart)`}
                  </div>
                  <Button
                    variant="sage"
                    size="sm"
                    onClick={() => handleApplySuggestedPair(suggestedPairs[0])}
                  >
                    Apply Suggested Pair
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                disabled={!selectedProjectId || projectMedia.length < 2}
                className="gap-1.5"
              >
                <span>Continue to Media Selection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT BEFORE MEDIA */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono uppercase font-bold text-[#111827] block">
                  Select Baseline Evidence (BEFORE)
                </label>
                <p className="text-xs text-[#6B7280]">
                  Choose the earlier or reference image depicting the baseline condition.
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B7280]">
                {projectMedia.length} available records
              </span>
            </div>

            {loadingMedia ? (
              <div className="p-8 text-center text-xs font-mono text-[#6B7280]">
                Loading verified media assets...
              </div>
            ) : projectMedia.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E2DFD8] text-xs font-mono text-[#6B7280]">
                No analyzed media found in this project. Please upload media first.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1">
                {projectMedia.map((m) => {
                  const isSelected = beforeMedia?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setBeforeMedia(m)}
                      className={`group cursor-pointer border p-2 text-left transition-all ${
                        isSelected
                          ? "border-[#111827] bg-[#F1EFEA] ring-2 ring-[#111827]"
                          : "border-[#E2DFD8] bg-white hover:border-[#9CA3AF]"
                      }`}
                    >
                      <div className="aspect-video w-full bg-neutral-900 overflow-hidden relative mb-2">
                        <img
                          src={getMediaAssetUrl(
                            m.thumbnail_url ||
                              (m.secure_url?.includes("/video/upload/")
                                ? m.secure_url
                                    .replace("/video/upload/", "/video/upload/so_0,c_fill,w_300,h_200,g_auto,f_jpg/")
                                    .replace(/\.[^/.]+$/, ".jpg")
                                : m.secure_url)
                          )}
                          alt={m.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = fallbackSvg;
                          }}
                        />
                        {m.media_type === "video" && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-mono uppercase px-1 py-0.5 rounded">
                            Video
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 left-1 bg-[#111827] text-white text-[9px] font-mono uppercase px-1.5 py-0.5">
                            Selected Baseline
                          </div>
                        )}
                      </div>
                      <p className="font-mono text-xs text-[#111827] font-semibold truncate">
                        {m.filename}
                      </p>
                      <p className="font-mono text-[10px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(m.created_at)}
                      </p>
                      {m.description && (
                        <p className="text-[10px] text-[#4B5563] line-clamp-2 mt-1 italic">
                          {m.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DFD8]">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!beforeMedia}
                onClick={() => setStep(3)}
                className="gap-1.5"
              >
                <span>Select Subsequent Media</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT AFTER MEDIA */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-mono uppercase font-bold text-[#204533] block">
                  Select Subsequent Evidence (AFTER)
                </label>
                <p className="text-xs text-[#6B7280]">
                  Choose the comparison image taken at a later date or post-intervention.
                </p>
              </div>
              <span className="text-xs font-mono text-[#204533]">
                Baseline: {beforeMedia?.filename}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto p-1">
              {projectMedia
                .filter((m) => m.id !== beforeMedia?.id)
                .map((m) => {
                  const isSelected = afterMedia?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setAfterMedia(m)}
                      className={`group cursor-pointer border p-2 text-left transition-all ${
                        isSelected
                          ? "border-[#204533] bg-[#EAF2EC] ring-2 ring-[#204533]"
                          : "border-[#E2DFD8] bg-white hover:border-[#9CA3AF]"
                      }`}
                    >
                      <div className="aspect-video w-full bg-neutral-900 overflow-hidden relative mb-2">
                        <img
                          src={getMediaAssetUrl(
                            m.thumbnail_url ||
                              (m.secure_url?.includes("/video/upload/")
                                ? m.secure_url
                                    .replace("/video/upload/", "/video/upload/so_0,c_fill,w_300,h_200,g_auto,f_jpg/")
                                    .replace(/\.[^/.]+$/, ".jpg")
                                : m.secure_url)
                          )}
                          alt={m.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = fallbackSvg;
                          }}
                        />
                        {m.media_type === "video" && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-mono uppercase px-1 py-0.5 rounded">
                            Video
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#204533] text-white text-[9px] font-mono uppercase px-1.5 py-0.5">
                            Selected After
                          </div>
                        )}
                      </div>
                      <p className="font-mono text-xs text-[#111827] font-semibold truncate">
                        {m.filename}
                      </p>
                      <p className="font-mono text-[10px] text-[#6B7280] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDate(m.created_at)}
                      </p>
                      {m.description && (
                        <p className="text-[10px] text-[#4B5563] line-clamp-2 mt-1 italic">
                          {m.description}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E2DFD8]">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!afterMedia}
                onClick={() => setStep(4)}
                className="gap-1.5"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & RUN AI COMPARISON */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-mono uppercase font-bold text-[#111827] block mb-1">
                Comparison Title (Optional)
              </label>
              <Input
                placeholder={`${selectedProject?.name || "Project"} - Impact Verification`}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            {/* Pair Confirmation Preview */}
            <div className="grid grid-cols-2 gap-4 bg-[#F8F7F4] p-4 border border-[#E2DFD8]">
              {/* Baseline Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#111827]">
                    01 • BASELINE EVIDENCE
                  </span>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    {formatDate(beforeMedia?.created_at)}
                  </span>
                </div>
                <div className="aspect-video w-full bg-neutral-900 border border-[#E2DFD8] overflow-hidden">
                  <img
                    src={getMediaAssetUrl(beforeMedia?.secure_url)}
                    alt="Baseline"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackSvg;
                    }}
                  />
                </div>
                <p className="text-xs font-mono font-medium text-[#111827] truncate">
                  {beforeMedia?.filename}
                </p>
                <p className="text-[11px] text-[#4B5563] line-clamp-2 italic">
                  {beforeMedia?.description || "Initial baseline condition"}
                </p>
              </div>

              {/* Subsequent Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#204533]">
                    02 • SUBSEQUENT EVIDENCE
                  </span>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    {formatDate(afterMedia?.created_at)}
                  </span>
                </div>
                <div className="aspect-video w-full bg-neutral-900 border border-[#B8D4C0] overflow-hidden">
                  <img
                    src={getMediaAssetUrl(afterMedia?.secure_url)}
                    alt="Subsequent"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackSvg;
                    }}
                  />
                </div>
                <p className="text-xs font-mono font-medium text-[#111827] truncate">
                  {afterMedia?.filename}
                </p>
                <p className="text-[11px] text-[#4B5563] line-clamp-2 italic">
                  {afterMedia?.description || "Subsequent field observation"}
                </p>
              </div>
            </div>

            {(beforeMedia?.media_type === "video" || afterMedia?.media_type === "video") && (
              <div className="p-3 bg-[#EAF2EC] border border-[#B8D4C0] text-xs font-mono text-[#1B3A2B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#204533] shrink-0" />
                <span>Video comparison uses representative evidence frames.</span>
              </div>
            )}

            <div className="p-3 bg-[#FAF9F6] border border-[#E2DFD8] text-[11px] font-mono text-[#6B7280] leading-relaxed">
              <span className="font-bold text-[#111827]">COMPLIANCE NOTICE:</span> The Multimodal AI comparator strictly evaluates visible, factual changes between records without asserting unvalidated mathematical percentages.
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#E2DFD8]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(3)}
                disabled={isSubmitting}
              >
                Back to Selection
              </Button>
              <Button
                variant="sage"
                size="md"
                onClick={handleCreate}
                loading={isSubmitting}
                className="gap-2 font-mono uppercase text-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Execute AI Impact Analysis</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
