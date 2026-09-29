import React, { useState } from "react";
import Link from "next/link";
import { Film, ArrowUpRight, Check, Trash2, Tag, Activity, Play } from "lucide-react";
import { MediaItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/utils";
import { getMediaAssetUrl } from "@/lib/api";

interface MediaCardProps {
  item: MediaItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  selected = false,
  onSelect,
  onDelete,
}) => {
  const isVideo = item.media_type === "video";
  const rawAssetUrl = item.secure_url || item.cloudinary_url;
  const assetUrl = getMediaAssetUrl(rawAssetUrl);
  const [posterError, setPosterError] = useState(false);

  // Derive high-resolution video frame poster thumbnail
  const videoPosterUrl = React.useMemo(() => {
    if (!isVideo) return assetUrl;
    if (item.thumbnail_url) return getMediaAssetUrl(item.thumbnail_url);
    if (rawAssetUrl && rawAssetUrl.includes("/video/upload/")) {
      const transformed = rawAssetUrl
        .replace("/video/upload/", "/video/upload/so_0,c_fill,w_400,h_260,g_auto,f_jpg/")
        .replace(/\.[^/.]+$/, ".jpg");
      return getMediaAssetUrl(transformed);
    }
    return assetUrl;
  }, [isVideo, item.thumbnail_url, rawAssetUrl, assetUrl]);

  return (
    <div
      className={`group bg-white border transition-all flex flex-col justify-between ${
        selected
          ? "border-[#111827] ring-1 ring-[#111827]"
          : "border-[#E2DFD8] hover:border-[#111827]"
      }`}
    >
      {/* Top Visual Area */}
      <Link href={`/media/${item.id}`} className="block relative">
        <div className="h-44 w-full bg-[#111827] overflow-hidden flex items-center justify-center border-b border-[#E2DFD8] relative">
          {isVideo ? (
            posterError ? (
              <div className="flex flex-col items-center justify-center text-[#9CA3AF]">
                <Film className="w-8 h-8 mb-1.5" />
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Video Record
                </span>
              </div>
            ) : (
              <>
                <img
                  src={videoPosterUrl}
                  alt={item.filename}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  onError={() => setPosterError(true)}
                />
                {/* Subtle Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center group-hover:bg-[#204533] group-hover:scale-110 transition-all border border-white/20 shadow-md">
                    <Play className="w-4 h-4 ml-0.5 fill-current text-white" />
                  </div>
                </div>
                {/* Duration Badge */}
                {item.duration_seconds && item.duration_seconds > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <span className="px-1.5 py-0.5 bg-black/85 text-white text-[10px] font-mono tabular-nums font-semibold backdrop-blur-xs border border-white/20">
                      {formatDuration(item.duration_seconds)}
                    </span>
                  </div>
                )}
              </>
            )
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

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={
                item.status === "verified" || item.status === "ready"
                  ? "sage"
                  : item.status === "analyzing" || item.status === "processing"
                  ? "blue"
                  : "amber"
              }
              size="sm"
            >
              {item.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Details Box */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <Link
              href={`/media/${item.id}`}
              className="text-xs font-semibold text-[#111827] hover:text-[#204533] font-mono line-clamp-1 transition-colors"
            >
              {item.filename}
            </Link>
            <Link
              href={`/media/${item.id}`}
              className="text-[#9CA3AF] hover:text-[#111827] shrink-0"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
            {item.project_name || "Unassigned Dossier"}
          </p>

          {/* AI Activity tag if verified */}
          {item.activity && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-[#204533] font-semibold bg-[#204533]/5 px-2 py-0.5 rounded border border-[#204533]/15">
              <Activity className="w-3 h-3 text-[#204533] shrink-0" />
              <span className="truncate">{item.activity}</span>
            </div>
          )}

          {/* AI Tags Preview */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.2 bg-[#F8F7F4] border border-[#111827]/10 text-[9px] font-mono text-[#4B5563]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
          <span className="tabular-nums">{formatBytes(item.file_size)}</span>
          <span className="text-[#9CA3AF]">{formatDate(item.created_at)}</span>
        </div>
      </div>

      {/* Selection / Action Bar */}
      <div className="px-3.5 py-1.5 bg-[#FAF9F6] border-t border-[#E2DFD8] flex items-center justify-between text-xs">
        {onSelect && (
          <button
            onClick={() => onSelect(item.id)}
            className="flex items-center text-[10px] font-mono text-[#4B5563] hover:text-[#111827]"
          >
            <span
              className={`w-3 h-3 border mr-1.5 flex items-center justify-center ${
                selected
                  ? "bg-[#111827] border-[#111827] text-white"
                  : "border-[#D1D5DB] bg-white"
              }`}
            >
              {selected && <Check className="w-2 h-2" />}
            </span>
            Select
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => onDelete(item.id, e)}
            className="text-[10px] font-mono text-[#9CA3AF] hover:text-[#991B1B] p-0.5 transition-colors"
            title="Delete from dossier"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
