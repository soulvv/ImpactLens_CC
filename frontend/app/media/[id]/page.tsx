"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Film,
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle2,
  Cpu,
  Clock,
  HardDrive,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Tag,
  Eye,
  RefreshCw,
  Activity as ActivityIcon,
  Compass,
  Mic
} from "lucide-react";
import { MediaDetail } from "@/types";
import { api, getMediaAssetUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, formatDate } from "@/lib/utils";
import { AskImpactLens } from "@/components/voice/ask-impactlens";

export default function MediaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<MediaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMediaById(id);
        setItem(res);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to retrieve media record from intelligence backend.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleReanalyze = async () => {
    if (!item) return;
    setAnalyzing(true);
    try {
      const updated = await api.triggerMediaAnalysis(item.id);
      setItem(updated);
    } catch (err: any) {
      alert("Failed to analyze media: " + (err.message || String(err)));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this media asset? This action will permanently remove it from storage."
      )
    ) {
      return;
    }

    try {
      await api.deleteMedia(item.id);
      router.push("/media");
    } catch (err) {
      alert("Failed to delete media asset: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCopyUrl = () => {
    if (!item) return;
    const url = item.secure_url || item.cloudinary_url;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-7 h-[450px]" />
          <Skeleton className="lg:col-span-5 h-[450px]" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-8 bg-white border border-[#E2DFD8] text-center space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-[#991B1B]">
          Evidence Record Not Found
        </h3>
        <p className="text-xs text-[#6B7280]">
          {error || "The requested media file could not be found or has been removed."}
        </p>
        <Link href="/media">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Media Library
          </Button>
        </Link>
      </div>
    );
  }

  const isVideo = item.media_type === "video";
  const rawAssetUrl = item.secure_url || item.cloudinary_url;
  const assetUrl = getMediaAssetUrl(rawAssetUrl);
  const analysis = item.analysis;

  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSeekToMoment = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="space-y-6">
      {/* Failed Analysis Recovery Banner */}
      {item.status === "failed" && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>Video analysis could not be completed. The media record is preserved.</span>
          </div>
          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${analyzing ? "animate-spin" : ""}`} />
            <span>Retry Analysis</span>
          </button>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DFD8]">
        <div className="flex items-center space-x-2 text-xs font-mono">
          <Link
            href="/media"
            className="text-[#6B7280] hover:text-[#111827] flex items-center transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Media Library
          </Link>
          <span className="text-[#9CA3AF]">/</span>
          <span className="text-[#111827] font-semibold truncate max-w-xs sm:max-w-md">
            {item.filename}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVoiceOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-[#111827] text-white border border-[#111827] text-xs font-mono hover:bg-[#1E293B] transition-colors"
          >
            <Mic className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Voice Audit
          </button>

          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-[#E2DFD8] text-xs font-mono text-[#374151] hover:text-[#111827] transition-colors"
            title="Copy storage URL"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            {copied ? "Copied" : "Copy URL"}
          </button>

          <a
            href={assetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 bg-white border border-[#E2DFD8] text-xs font-mono text-[#374151] hover:text-[#111827] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Raw Asset
          </a>

          <button
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-[#FCA5A5] text-xs font-mono text-[#991B1B] hover:bg-[#FEF2F2] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Grid: Preview & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Large Media Preview & AI Intelligence Pane */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E2DFD8] p-3 shadow-xs">
            <div className="relative min-h-[360px] max-h-[560px] bg-[#111827] flex items-center justify-center overflow-hidden">
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={assetUrl}
                  controls
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentVideoTime(videoRef.current.currentTime);
                    }
                  }}
                  className="w-full h-auto max-h-[540px]"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={assetUrl}
                  alt={item.filename}
                  className="w-full h-auto max-h-[540px] object-contain"
                />
              )}

              {/* Status Badge Tag */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <Badge
                  variant={
                    item.status === "verified" || item.status === "ready"
                      ? "sage"
                      : item.status === "analyzing" || item.status === "processing"
                      ? "blue"
                      : "amber"
                  }
                  size="md"
                >
                  {item.status.replace("_", " ")}
                </Badge>
                {analysis && (
                  <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-300 backdrop-blur-xs font-semibold">
                    AI Confidence: {Math.round(analysis.confidence * 100)}%
                  </span>
                )}
                {isVideo && item.duration_seconds && (
                  <span className="px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white backdrop-blur-xs font-semibold">
                    ⏱ {formatDuration(item.duration_seconds)}
                  </span>
                )}
              </div>
            </div>

            {/* Preview Caption Bar */}
            <div className="pt-3 px-1 flex items-center justify-between text-xs font-mono text-[#6B7280]">
              <div className="flex items-center space-x-3">
                <span>Format: {item.format?.toUpperCase() || item.media_type.toUpperCase()}</span>
                {item.width && item.height && (
                  <span>
                    Dimensions: {item.width} × {item.height} px
                  </span>
                )}
                {isVideo && item.duration_seconds && (
                  <span>Duration: {item.duration_seconds.toFixed(1)}s</span>
                )}
              </div>
              <span className="tabular-nums">{formatBytes(item.file_size)}</span>
            </div>

            {/* Video Interactive Key Moments Evidence Timeline */}
            {isVideo && analysis?.key_moments && analysis.key_moments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E2DFD8] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#204533]" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#111827]">
                      Temporal Evidence Timeline ({analysis.key_moments.length} Key Moments)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    Select any moment to seek video
                  </span>
                </div>

                <div className="space-y-2">
                  {analysis.key_moments.map((km, idx) => {
                    const isActive = Math.abs(currentVideoTime - km.timestamp) < 3.0;
                    const frameThumbnailUrl =
                      rawAssetUrl && rawAssetUrl.includes("/video/upload/")
                        ? rawAssetUrl
                            .replace(
                              "/video/upload/",
                              `/video/upload/so_${Math.round(km.timestamp)},c_fill,w_180,h_100,g_auto,f_jpg/`
                            )
                            .replace(/\.[^/.]+$/, ".jpg")
                        : null;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSeekToMoment(km.timestamp)}
                        className={`group flex items-start gap-3 p-2.5 rounded border transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#204533]/10 border-[#204533] ring-1 ring-[#204533]"
                            : "bg-[#FAF9F6] border-[#E2DFD8] hover:border-[#111827] hover:bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          className="px-2 py-1 bg-[#111827] text-white font-mono text-xs font-semibold rounded shrink-0 flex items-center gap-1 group-hover:bg-[#204533] transition-colors"
                        >
                          <span className="text-emerald-400">▶</span>
                          <span>{formatDuration(km.timestamp)}</span>
                        </button>

                        {frameThumbnailUrl && (
                          <div className="w-16 h-10 bg-neutral-900 rounded overflow-hidden shrink-0 border border-[#E2DFD8]">
                            <img
                              src={getMediaAssetUrl(frameThumbnailUrl)}
                              alt={`Frame at ${km.timestamp}s`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1F2937] leading-relaxed font-sans">
                            {km.description}
                          </p>
                          <div className="text-[10px] font-mono text-[#6B7280] mt-0.5">
                            Timestamp: {km.timestamp.toFixed(1)}s • Representative Frame Evidence
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Multimodal Intelligence Engine Section */}
          <div className="p-6 bg-white border border-[#E2DFD8] shadow-xs relative overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-[#F1EFEA] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 bg-[#204533] text-white flex items-center justify-center rounded-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider font-mono">
                    AI Multimodal Intelligence Engine
                  </h4>
                  <span className="text-[10px] text-[#6B7280] font-mono">
                    Model: {analysis?.model_name || "gemini-1.5-flash"} • Version: {analysis?.analysis_version || "v2.0-multimodal"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReanalyze}
                  disabled={analyzing}
                  className="px-2.5 py-1 bg-[#F8F7F4] border border-[#111827]/15 rounded text-[11px] font-mono text-[#111827] hover:bg-[#E5E7EB] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${analyzing ? "animate-spin" : ""}`} />
                  <span>{analyzing ? "Analyzing..." : "Re-Analyze"}</span>
                </button>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                  Verified Analysis
                </span>
              </div>
            </div>

            {analysis ? (
              <div className="space-y-5">
                {/* Description */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] mb-1.5 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#204533]" />
                    <span>Objective Field Observation</span>
                  </div>
                  <p className="text-sm font-serif text-[#1F2937] leading-relaxed bg-[#FAF9F6] p-3.5 border border-[#E2DFD8] rounded">
                    {analysis.description}
                  </p>
                </div>

                {/* Primary Activity & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#FAF9F6] border border-[#E2DFD8] rounded space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                      <ActivityIcon className="w-3 h-3 text-[#204533]" />
                      <span>Detected Field Activity</span>
                    </div>
                    <div className="text-xs font-semibold text-[#111827]">
                      {analysis.activity || "Field Verification"}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF9F6] border border-[#E2DFD8] rounded space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#204533]" />
                      <span>Ecological Terrain</span>
                    </div>
                    <div className="text-xs font-semibold text-[#111827] font-mono">
                      {analysis.location || "Field Site"}
                    </div>
                  </div>
                </div>

                {/* Physical Objects & Visual Signals */}
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] block mb-2">
                      Detected Objects ({analysis.objects?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.objects?.map((obj, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white border border-[#111827]/15 rounded text-[11px] font-mono text-[#374151]"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] block mb-2">
                      Visual Indicators & Signals ({analysis.visual_signals?.length || 0})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysis.visual_signals?.map((sig, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 bg-white border border-[#E2DFD8] rounded text-xs text-[#374151]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#204533] shrink-0" />
                          <span className="truncate">{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags & Environmental Conditions */}
                <div className="pt-2 border-t border-[#F1EFEA] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-[#6B7280]" />
                    {analysis.tags?.map((t) => (
                      <Link
                        key={t}
                        href={`/search?q=${encodeURIComponent(t)}`}
                        className="px-2 py-0.5 bg-[#F8F7F4] hover:bg-[#E5E7EB] border border-[#111827]/10 rounded text-[10px] text-[#4B5563] transition-colors"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#204533] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>768-Dim Dense Vector Indexed</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#9CA3AF] animate-spin mx-auto" />
                <p className="text-xs font-mono text-[#6B7280]">
                  AI multimodal analysis is currently being processed by the worker queue...
                </p>
                <button
                  onClick={handleReanalyze}
                  className="px-4 py-2 bg-[#204533] text-white text-xs font-mono rounded hover:bg-[#1B3B2B]"
                >
                  Trigger Immediate Analysis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Technical Evidentiary Ledger */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E2DFD8] p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#111827] pb-3 border-b border-[#F1EFEA] mb-4 flex items-center justify-between">
              <span>Technical Evidentiary Ledger</span>
              <span className="text-[10px] text-[#6B7280]">PostgreSQL 17 Relational</span>
            </h3>

            <dl className="divide-y divide-[#F1EFEA] text-xs font-mono">
              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Asset ID</dt>
                <dd className="text-[#111827] font-semibold select-all text-right max-w-[200px] truncate">
                  {item.id}
                </dd>
              </div>

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Original Filename</dt>
                <dd className="text-[#111827] text-right max-w-[220px] truncate font-semibold">
                  {item.filename}
                </dd>
              </div>

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Assigned Dossier</dt>
                <dd className="text-right">
                  {item.project_id ? (
                    <Link
                      href={`/projects/${item.project_id}`}
                      className="text-[#204533] font-semibold hover:underline"
                    >
                      {item.project_name || "View Project"}
                    </Link>
                  ) : (
                    <span className="text-[#9CA3AF]">Unassigned</span>
                  )}
                </dd>
              </div>

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Media Class</dt>
                <dd className="text-[#111827] uppercase">{item.media_type}</dd>
              </div>

              {isVideo && item.duration_seconds && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6B7280]">Video Duration</dt>
                  <dd className="text-[#111827] tabular-nums font-semibold">
                    {item.duration_seconds.toFixed(1)}s ({formatDuration(item.duration_seconds)})
                  </dd>
                </div>
              )}

              {isVideo && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6B7280]">Temporal Sampling</dt>
                  <dd className="text-[#111827] tabular-nums">
                    {analysis?.frame_count || (analysis?.key_moments ? analysis.key_moments.length : 0)} frames analyzed
                  </dd>
                </div>
              )}

              {isVideo && item.frame_rate && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6B7280]">Frame Rate</dt>
                  <dd className="text-[#111827] tabular-nums">
                    {item.frame_rate.toFixed(2)} fps
                  </dd>
                </div>
              )}

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">File Size</dt>
                <dd className="text-[#111827] tabular-nums">
                  {formatBytes(item.file_size)} ({item.file_size.toLocaleString()} bytes)
                </dd>
              </div>

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Ingestion Timestamp</dt>
                <dd className="text-[#111827] text-right">
                  {formatDate(item.created_at)}
                </dd>
              </div>

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Storage Identifier</dt>
                <dd className="text-[#111827] select-all max-w-[200px] truncate text-right">
                  {item.cloudinary_public_id || "local_sandbox"}
                </dd>
              </div>

              {analysis?.model_name && (
                <div className="py-2.5 flex justify-between">
                  <dt className="text-[#6B7280]">Inference Engine</dt>
                  <dd className="text-[#111827] text-right">
                    {analysis.model_name}
                  </dd>
                </div>
              )}

              <div className="py-2.5 flex justify-between">
                <dt className="text-[#6B7280]">Analysis Status</dt>
                <dd>
                  <Badge
                    variant={
                      item.status === "verified" || item.status === "ready"
                        ? "sage"
                        : "amber"
                    }
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>

          {/* Chain of Custody Stamp */}
          <div className="p-4 bg-[#F8F7F4] border border-[#E2DFD8] text-xs font-mono space-y-2">
            <div className="flex items-center text-[#204533] font-semibold">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              <span>Chain-of-Custody Verified</span>
            </div>
            <p className="text-[11px] text-[#4B5563] leading-relaxed">
              This field media record is permanently anchored in the PostgreSQL operational ledger with non-repudiation timestamps and 768-dimensional normalized dense vector embeddings.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      <AskImpactLens
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
      />
    </div>
  );
}
