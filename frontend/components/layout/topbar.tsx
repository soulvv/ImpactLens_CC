"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  CheckCircle2,
  ChevronDown,
  Mic,
} from "lucide-react";
import { AskImpactLens } from "@/components/voice/ask-impactlens";

export const Topbar: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    } else {
      router.push("/search");
    }
  };

  return (
    <>
      <header className="h-12 border-b border-[#E2DFD8] bg-white px-6 flex items-center justify-between sticky top-0 z-30 select-none font-sans">
        {/* Workspace Context Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center px-2 py-1 bg-[#F8F7F4] border border-[#E2DFD8] text-[11px] font-mono text-[#111827]">
            <Building2 className="w-3 h-3 mr-1.5 text-[#204533]" />
            <span className="font-semibold">Global Ecological Trust</span>
            <span className="mx-1.5 text-[#9CA3AF]">/</span>
            <span className="text-[#6B7280]">Northern Corridor</span>
            <ChevronDown className="w-3 h-3 ml-1.5 text-[#9CA3AF]" />
          </div>

          {/* Telemetry Status Indicator */}
          <div className="hidden md:flex items-center space-x-1 text-[10px] font-mono text-[#204533] bg-[#EAF2EC] px-2 py-0.5 border border-[#B8D4C0]">
            <CheckCircle2 className="w-3 h-3 text-[#204533]" />
            <span>AI Multimodal Engine Active</span>
          </div>
        </div>

        {/* Global Query / Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search field records, ecological signals, or press Enter..."
              className="w-full h-7 pl-8 pr-12 text-[11px] font-mono bg-[#F8F7F4] border border-[#E2DFD8] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#111827]"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#9CA3AF] bg-white px-1 py-0.2 border border-[#E2DFD8]">
              ↵
            </kbd>
          </form>
        </div>

        {/* Voice Assistant Trigger & Auditor Identity */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVoiceOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111827] text-white hover:bg-[#1E293B] text-[11px] font-mono rounded transition-colors shadow-2xs"
            title="Launch OmniDimension Voice Assistant"
          >
            <Mic className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Ask ImpactLens</span>
          </button>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#4B5563] pl-2 border-l border-[#E2DFD8]">
            <span className="w-2 h-2 rounded-full bg-[#204533]"></span>
            <span className="font-semibold text-[#111827]">Auditor Node #04</span>
            <span className="text-[#9CA3AF] hidden sm:inline">(Dr. E. Vance)</span>
          </div>
        </div>
      </header>

      {/* Voice Assistant Modal */}
      <AskImpactLens
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
      />
    </>
  );
};
