import React from "react";
import Link from "next/link";
import { UploadCloud, ArrowRight, ShieldCheck } from "lucide-react";

export const QuickUploadCta: React.FC = () => {
  return (
    <div className="p-4 bg-white border border-[#E2DFD8] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#204533] font-semibold">
            Field Evidence Ingest
          </span>
          <span className="flex items-center text-[10px] font-mono text-[#6B7280]">
            <ShieldCheck className="w-3 h-3 mr-1 text-[#204533]" />
            SHA-256 Seal
          </span>
        </div>
        <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider font-mono">
          Direct Ingestion Terminal
        </h4>
        <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
          Ingest geotagged surveys, drone orthomosaics, or video recordings directly into project dossiers with automated metadata extraction.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E2DFD8] flex items-center justify-between">
        <span className="text-[10px] font-mono text-[#9CA3AF]">
          RAW, JPG, PNG, MP4 up to 500MB
        </span>
        <Link
          href="/upload"
          className="inline-flex items-center px-3 py-1.5 bg-[#111827] text-white text-[11px] font-mono uppercase tracking-wider hover:bg-[#1F2937] transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
          Ingest Files
          <ArrowRight className="w-3 h-3 ml-1.5 text-[#9CA3AF]" />
        </Link>
      </div>
    </div>
  );
};
