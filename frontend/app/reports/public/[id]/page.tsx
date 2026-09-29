"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { getPublicReport } from "@/lib/api";
import { Report } from "@/types";
import { ReportView } from "@/components/reports/report-view";

export default function PublicReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPublicReport();
    }
  }, [id]);

  const loadPublicReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicReport(id);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load public report", err);
      setError("This impact report is unavailable or may have been restricted.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#204533]" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#6B7280]">
          Loading Verified Public Impact Report...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <div className="w-12 h-12 bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold font-serif text-[#111827]">
            Public Report Not Found
          </h2>
          <p className="text-xs text-[#6B7280] font-mono max-w-md">
            {error || "The requested publication does not exist or has expired."}
          </p>
        </div>
      </div>
    );
  }

  return <ReportView report={report} isPublic={true} />;
}
