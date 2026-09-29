import React from "react";
import { Activity as ActivityType } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUp, FolderPlus, CheckCircle, AlertCircle } from "lucide-react";

interface RecentActivityFeedProps {
  activities: ActivityType[];
  loading?: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start space-x-3 p-3 bg-white border border-[#E2DFD8]">
            <Skeleton className="h-6 w-6 rounded-none shrink-0" />
            <div className="space-y-1.5 w-full">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 bg-white border border-[#E2DFD8] text-center text-xs text-[#6B7280]">
        No audit entries recorded yet.
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "media_uploaded":
        return <FileUp className="w-3.5 h-3.5 text-[#224836]" />;
      case "project_created":
      case "project_initialized":
        return <FolderPlus className="w-3.5 h-3.5 text-[#111827]" />;
      case "audit_verified":
        return <CheckCircle className="w-3.5 h-3.5 text-[#224836]" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-[#6B7280]" />;
    }
  };

  return (
    <div className="bg-white border border-[#E2DFD8] divide-y divide-[#F1EFEA]">
      {activities.map((item) => (
        <div key={item.id} className="p-3.5 flex items-start space-x-3">
          <div className="p-1.5 bg-[#F8F7F4] border border-[#E2DFD8] shrink-0 mt-0.5">
            {getActionIcon(item.action)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#111827] leading-relaxed">
              {item.description}
            </p>
            <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-[#9CA3AF]">
              <span>{formatRelativeTime(item.created_at)}</span>
              {item.project_name && (
                <>
                  <span>•</span>
                  <span className="text-[#6B7280]">{item.project_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
