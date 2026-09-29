"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FolderTree,
} from "lucide-react";
import { Project } from "@/types";
import { api } from "@/lib/api";
import { FileDropzone } from "@/components/upload/file-dropzone";
import {
  UploadQueueList,
  QueueFile,
} from "@/components/upload/upload-queue-list";
import { Button } from "@/components/ui/button";

function UploadContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project_id") || "unassigned";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [queue, setQueue] = useState<QueueFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects list for upload selector:", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, []);

  const handleFilesSelected = (files: File[]) => {
    const newItems: QueueFile[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : "",
      progress: 0,
      status: "pending",
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemove = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((q) => q.id !== id);
    });
  };

  const uploadSingleFile = async (item: QueueFile) => {
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id ? { ...q, status: "uploading", progress: 10 } : q
      )
    );

    try {
      const result = await api.uploadMedia(
        item.file,
        selectedProjectId !== "unassigned" ? selectedProjectId : undefined,
        (progress) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress } : q))
          );
        }
      );

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: "success", progress: 100, mediaId: result.id }
            : q
        )
      );
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during upload.";
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "error", error: errMsg } : q
        )
      );
    }
  };

  const startBatchUpload = async () => {
    const pendingItems = queue.filter(
      (q) => q.status === "pending" || q.status === "error"
    );
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    // Process files sequentially or in small concurrency
    for (const item of pendingItems) {
      await uploadSingleFile(item);
    }
    setIsUploading(false);
  };

  const handleRetry = (id: string) => {
    const target = queue.find((q) => q.id === id);
    if (target) {
      uploadSingleFile(target);
    }
  };

  const completedCount = queue.filter((q) => q.status === "success").length;
  const pendingCount = queue.filter(
    (q) => q.status === "pending" || q.status === "error"
  ).length;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E2DFD8]">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#224836] font-semibold mb-1">
            Data Intake Pipeline
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827] uppercase font-mono">
            Field Evidence Ingestion
          </h1>
          <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
            Directly upload photographic surveys, drone orthomosaics, and environmental video footage through the verified API into Cloudinary and the PostgreSQL chain-of-custody ledger.
          </p>
        </div>

        {completedCount > 0 && (
          <Link href="/media">
            <Button variant="secondary" size="sm">
              View In Library <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Main Upload Zone */}
      <FileDropzone
        onFilesSelected={handleFilesSelected}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        projects={projects}
        disabled={isUploading}
      />

      {/* Ingestion Queue List */}
      <UploadQueueList
        queue={queue}
        onRemove={handleRemove}
        onRetry={handleRetry}
      />

      {/* Action Footer Bar */}
      {queue.length > 0 && (
        <div className="p-4 bg-white border border-[#E2DFD8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-mono text-[#6B7280]">
            <span>{pendingCount} pending files</span>
            {completedCount > 0 && (
              <span className="ml-3 text-[#224836] font-semibold">
                ✓ {completedCount} indexed in database
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQueue([])}
              disabled={isUploading}
            >
              Clear Queue
            </Button>

            <Button
              variant="sage"
              size="sm"
              onClick={startBatchUpload}
              disabled={isUploading || pendingCount === 0}
              loading={isUploading}
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              {isUploading
                ? "Ingesting Evidence..."
                : `Ingest ${pendingCount} Files`}
            </Button>
          </div>
        </div>
      )}

      {/* Security & Verification Disclaimer */}
      <div className="p-4 bg-[#F8F7F4] border border-[#E2DFD8] flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 text-[#224836] shrink-0 mt-0.5" />
        <div className="text-xs font-mono text-[#4B5563] leading-relaxed">
          <span className="font-semibold text-[#111827]">
            Non-Repudiation Architecture:
          </span>{" "}
          Uploaded field evidence is cryptographically signed, associated with non-fungible UTC ingestion timestamps, and prepared for future multimodal AI feature analysis in Phase 2.
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-xs text-[#6B7280]">
          Loading field ingestion pipeline...
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
