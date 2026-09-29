import React from "react";
import Link from "next/link";
import { FolderTree, MapPin, Building, ArrowUpRight, Film } from "lucide-react";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="bg-white border border-[#E2DFD8] hover:border-[#111827] transition-all flex flex-col justify-between group">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-[#F8F7F4] border border-[#E2DFD8] text-[#224836] flex items-center justify-center shrink-0">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
            <Badge
              variant={project.status === "active" ? "sage" : "neutral"}
              size="sm"
            >
              {project.status}
            </Badge>
          </div>
          <Link
            href={`/projects/${project.id}`}
            className="text-[#9CA3AF] group-hover:text-[#111827] transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Name and description */}
        <Link href={`/projects/${project.id}`} className="block">
          <h3 className="text-sm font-semibold text-[#111827] group-hover:text-[#224836] transition-colors font-mono line-clamp-1">
            {project.name}
          </h3>
        </Link>

        <p className="text-xs text-[#4B5563] mt-2 line-clamp-2 leading-relaxed">
          {project.description || "No project documentation or thesis defined yet."}
        </p>

        {/* Metadata items */}
        <div className="mt-4 space-y-1.5 pt-3 border-t border-[#F1EFEA] text-[11px] text-[#6B7280]">
          {project.location && (
            <div className="flex items-center truncate">
              <MapPin className="w-3 h-3 mr-1.5 text-[#9CA3AF] shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          {project.organization && (
            <div className="flex items-center truncate">
              <Building className="w-3 h-3 mr-1.5 text-[#9CA3AF] shrink-0" />
              <span className="truncate">{project.organization}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div className="px-5 py-2.5 bg-[#FAF9F6] border-t border-[#E2DFD8] flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
        <span className="flex items-center text-[#224836] font-semibold">
          <Film className="w-3 h-3 mr-1" />
          {project.media_count || 0} media assets
        </span>
        <span className="text-[#9CA3AF]">
          {formatDate(project.created_at)}
        </span>
      </div>
    </div>
  );
};
