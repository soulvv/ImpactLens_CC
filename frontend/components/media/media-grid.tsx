import React from "react";
import { MediaItem } from "@/types";
import { MediaCard } from "./media-card";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaGridProps {
  items: MediaItem[];
  loading?: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onDeleteItem?: (id: string, e: React.MouseEvent) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  loading,
  selectedIds,
  onToggleSelect,
  onDeleteItem,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="border border-[#E2DFD8] bg-white p-3 space-y-3">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          selected={selectedIds.includes(item.id)}
          onSelect={onToggleSelect}
          onDelete={onDeleteItem}
        />
      ))}
    </div>
  );
};
