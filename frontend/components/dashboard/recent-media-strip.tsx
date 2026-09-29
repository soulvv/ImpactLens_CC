import React from "react";
import Link from "next/link";
import { Film, ArrowUpRight } from "lucide-react";
import { MediaItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { getMediaAssetUrl } from "@/lib/api";

interface RecentMediaStripProps {
  media: MediaItem[];
  loading?: boolean;
}

export const RecentMediaStrip: React.FC<RecentMediaStripProps> = ({
  media,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-[#E2DFD8] bg-white p-3 space-y-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-[#E2DFD8]">
        <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider font-mono">
          No Recent Field Evidence
        </h4>
        <p className="text-xs text-[#6B7280] mt-1">
          No media records ingested in this workspace yet. Upload field surveys to populate the registry.
        </p>
        <Link
          href="/upload"
          className="mt-3 inline-flex items-center text-xs font-mono text-[#204533] font-semibold hover:underline"
        >
          Upload Evidence <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {media.map((item) => {
        const isVideo = item.media_type === "video";
        const assetUrl = getMediaAssetUrl(item.secure_url || item.cloudinary_url);

        return (
          <Link
            key={item.id}
            href={`/media/${item.id}`}
            className="group block bg-white border border-[#E2DFD8] hover:border-[#111827] transition-all"
          >
            {/* Visual Thumbnail */}
            <div className="relative h-40 w-full bg-[#EAE7DF] overflow-hidden flex items-center justify-center border-b border-[#E2DFD8]">
              {isVideo ? (
                <div className="flex flex-col items-center justify-center text-[#6B7280]">
                  <Film className="w-7 h-7 mb-1.5" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Video Record
                  </span>
                </div>
              ) : (
                <img
                  src={assetUrl}
                  alt={item.filename}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}

              {/* Minimal format badge */}
              <div className="absolute top-2 left-2">
                <span className="px-1.5 py-0.5 bg-[#111827]/90 text-white text-[9px] font-mono uppercase font-semibold">
                  {item.format ? item.format.toUpperCase() : item.media_type.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Structured Metadata Pane */}
            <div className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-1">
                <h4 className="text-xs font-medium text-[#111827] truncate group-hover:text-[#204533] transition-colors font-mono">
                  {item.filename}
                </h4>
                <Badge
                  variant={
                    item.status === "verified" || item.status === "ready"
                      ? "sage"
                      : item.status === "processing"
                      ? "blue"
                      : "amber"
                  }
                  size="sm"
                >
                  {item.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
                <span className="truncate max-w-[140px]">
                  {item.project_name || "Unassigned"}
                </span>
                <span className="tabular-nums shrink-0">
                  {formatBytes(item.file_size)} • {formatRelativeTime(item.created_at)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
