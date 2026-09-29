import React from "react";
import { CheckCircle2, AlertCircle, X, Film, Image as ImageIcon, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export interface QueueFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  mediaId?: string;
}

interface UploadQueueListProps {
  queue: QueueFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const UploadQueueList: React.FC<UploadQueueListProps> = ({
  queue,
  onRemove,
  onRetry,
}) => {
  if (queue.length === 0) return null;

  return (
    <div className="bg-white border border-[#E2DFD8] p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1EFEA]">
        <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#111827]">
          Ingestion Queue ({queue.length} items)
        </h4>
        <div className="text-[11px] font-mono text-[#6B7280]">
          {queue.filter((q) => q.status === "success").length} of {queue.length} completed
        </div>
      </div>

      <div className="space-y-3">
        {queue.map((item) => {
          const isVideo = item.file.type.startsWith("video");

          return (
            <div
              key={item.id}
              className="p-3 bg-[#FAF9F6] border border-[#E2DFD8] flex items-center justify-between gap-4"
            >
              {/* Thumbnail / Icon preview */}
              <div className="w-12 h-12 bg-[#EAE7DF] border border-[#E2DFD8] shrink-0 overflow-hidden flex items-center justify-center">
                {isVideo ? (
                  <Film className="w-5 h-5 text-[#6B7280]" />
                ) : item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-[#6B7280]" />
                )}
              </div>

              {/* File Info & Progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#111827] truncate max-w-xs sm:max-w-md">
                    {item.file.name}
                  </span>
                  <span className="text-[#6B7280] tabular-nums shrink-0 ml-2">
                    {formatBytes(item.file.size)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E2DFD8] h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      item.status === "success"
                        ? "bg-[#224836]"
                        : item.status === "error"
                        ? "bg-[#991B1B]"
                        : "bg-[#111827]"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {/* Status text */}
                <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                  {item.status === "uploading" && (
                    <span className="text-[#111827] flex items-center">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin text-[#224836]" />
                      Ingesting to Cloudinary... {item.progress}%
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="text-[#6B7280]">Queued for transmission</span>
                  )}
                  {item.status === "success" && (
                    <span className="text-[#224836] font-semibold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Uploaded & Indexed in Ledger
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="text-[#991B1B] font-semibold flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {item.error || "Ingestion failed"}
                    </span>
                  )}

                  {item.mediaId && (
                    <a
                      href={`/media/${item.mediaId}`}
                      className="text-[#224836] hover:underline"
                    >
                      Inspect Record →
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center space-x-1">
                {item.status === "error" && (
                  <button
                    onClick={() => onRetry(item.id)}
                    className="px-2 py-1 bg-white border border-[#E2DFD8] text-[10px] font-mono text-[#111827] hover:bg-[#F1EFEA]"
                  >
                    Retry
                  </button>
                )}

                {item.status !== "uploading" && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 text-[#9CA3AF] hover:text-[#111827]"
                    title="Remove from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
