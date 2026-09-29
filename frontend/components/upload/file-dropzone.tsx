import React, { useRef, useState } from "react";
import { UploadCloud, FolderTree, FileCheck, AlertCircle } from "lucide-react";
import { Project } from "@/types";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  selectedProjectId,
  onProjectChange,
  projects,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      // Reset input value so same files can be re-selected if needed
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Project Assignment Dropdown */}
      <div className="bg-white border border-[#E2DFD8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FolderTree className="w-4 h-4 text-[#224836]" />
          <div>
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111827]">
              Target Project Dossier
            </span>
            <p className="text-[11px] text-[#6B7280]">
              Assign incoming field media directly to an environmental project
            </p>
          </div>
        </div>

        <select
          value={selectedProjectId}
          onChange={(e) => onProjectChange(e.target.value)}
          disabled={disabled}
          className="h-9 px-3 bg-[#F8F7F4] border border-[#E2DFD8] text-xs font-mono text-[#111827] focus:outline-none focus:border-[#111827] disabled:opacity-50"
        >
          <option value="unassigned">-- Unassigned Dossier --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.location || "Global"})
            </option>
          ))}
        </select>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed p-10 text-center transition-all cursor-pointer bg-white ${
          isDragOver
            ? "border-[#224836] bg-[#EAF2EC]/40"
            : "border-[#D4D0C7] hover:border-[#111827] hover:bg-[#FAF9F6]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.mp4,.mov,.avi,.webp,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="inline-flex p-4 bg-[#F8F7F4] border border-[#E2DFD8] text-[#224836] mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider font-mono text-[#111827]">
          Drop Field Media Files Here, or Click to Browse
        </h3>
        <p className="text-xs text-[#4B5563] mt-2 max-w-md mx-auto leading-relaxed">
          Supports high-resolution RAW, JPG, PNG, and drone monitoring video (MP4, MOV).
          Files are transmitted directly through the verified backend to Cloudinary storage.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-[#6B7280]">
          <span className="flex items-center">
            <FileCheck className="w-3.5 h-3.5 mr-1 text-[#224836]" />
            EXIF & GPS Extracted
          </span>
          <span>•</span>
          <span>Batch Ingestion Supported</span>
          <span>•</span>
          <span>Max 500MB per asset</span>
        </div>
      </div>
    </div>
  );
};
