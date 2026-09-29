"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  FolderTree,
  UploadCloud,
  Layers,
  Database,
  ShieldCheck,
  Search,
  GitCompare,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Find Evidence", href: "/search", icon: Search },
  { name: "Media Library", href: "/media", icon: Film },
  { name: "Projects", href: "/projects", icon: FolderTree },
  { name: "Impact Comparisons", href: "/compare", icon: GitCompare },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Upload", href: "/upload", icon: UploadCloud },
];


export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-[#E2DFD8] bg-[#F4F3F0] flex flex-col justify-between select-none shrink-0 h-screen sticky top-0 font-sans">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#E2DFD8] bg-[#ECE9E2]/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 bg-[#204533] flex items-center justify-center text-white shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="text-xs font-bold tracking-tight text-[#111827] uppercase font-mono">
                  ImpactLens
                </span>
                <span className="text-[9px] px-1 py-0.5 bg-[#204533]/10 text-[#204533] font-mono font-semibold">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-mono mt-1 truncate">
                Media Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-2.5 py-4">
          <div className="px-2 pb-2 text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] font-mono">
            Navigation
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2.5 py-2 text-xs transition-colors group relative font-mono",
                    isActive
                      ? "bg-white text-[#111827] border border-[#E2DFD8] font-semibold"
                      : "text-[#4B5563] hover:text-[#111827] hover:bg-[#EAE7DF] border border-transparent"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#204533]" />
                  )}
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 mr-2.5 shrink-0 transition-colors",
                      isActive
                        ? "text-[#204533]"
                        : "text-[#6B7280] group-hover:text-[#111827]"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3.5 border-t border-[#E2DFD8] bg-[#EAE7DF]/60 text-[10px] text-[#6B7280] font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center text-[#374151]">
            <Database className="w-3 h-3 mr-1.5 text-[#204533]" />
            PostgreSQL 17
          </span>
          <span className="text-[#204533] font-semibold">CONNECTED</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-[#374151]">
            <ShieldCheck className="w-3 h-3 mr-1.5 text-[#204533]" />
            Reports & Storytelling
          </span>
          <span className="text-[#204533] font-semibold">PHASE 4 ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};

