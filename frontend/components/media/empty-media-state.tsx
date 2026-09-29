import React from "react";
import Link from "next/link";
import { Film, UploadCloud, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyMediaStateProps {
  filtered?: boolean;
  onClearFilters?: () => void;
}

export const EmptyMediaState: React.FC<EmptyMediaStateProps> = ({
  filtered = false,
  onClearFilters,
}) => {
  if (filtered) {
    return (
      <div className="p-12 text-center bg-white border border-[#E2DFD8]">
        <div className="inline-flex p-3 bg-[#F8F7F4] text-[#6B7280] mb-3">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider font-mono">
          No Matching Evidence Records
        </h3>
        <p className="text-xs text-[#6B7280] mt-1.5 max-w-md mx-auto leading-relaxed">
          No media records match the active filter criteria or search query. Modify or reset your filters to inspect other evidence records.
        </p>
        {onClearFilters && (
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onClearFilters}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-12 text-center bg-white border border-[#E2DFD8]">
      <div className="inline-flex p-3.5 bg-[#F8F7F4] border border-[#E2DFD8] text-[#224836] mb-4">
        <Film className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider font-mono">
        No field evidence has been uploaded yet.
      </h3>
      <p className="text-xs text-[#4B5563] mt-2 max-w-lg mx-auto leading-relaxed">
        Ingest high-resolution photographic surveys, drone orthomosaics, or project footage to begin assembling the impact dossier. All uploaded media will be indexed with immutable timestamps and ready for future multimodal AI analysis.
      </p>
      <div className="mt-6 flex items-center justify-center space-x-3">
        <Link href="/upload">
          <Button variant="sage" size="md">
            <UploadCloud className="w-3.5 h-3.5 mr-2" />
            Ingest First Field Media
          </Button>
        </Link>
        <Link href="/projects">
          <Button variant="secondary" size="md">
            <FolderPlus className="w-3.5 h-3.5 mr-2" />
            Create Project Dossier
          </Button>
        </Link>
      </div>
    </div>
  );
};
