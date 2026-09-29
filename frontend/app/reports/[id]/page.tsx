"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, FileText } from "lucide-react";
import { getReportById } from "@/lib/api";
import { Report } from "@/types";
import { ReportView } from "@/components/reports/report-view";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReportById(id);
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load report", err);
      setError(err.message || "Failed to load report. It may have been removed or does not exist.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#204533]" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#6B7280]">
          Loading Impact Report Dossier...
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
            Report Unavailable
          </h2>
          <p className="text-xs text-[#6B7280] font-mono max-w-md">
            {error || "The requested impact report could not be found."}
          </p>
        </div>
        <div className="flex items-center space-x-3 pt-2">
          <Link
            href="/reports"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-[#E2DFD8] hover:bg-[#EAE7DF] text-xs font-mono text-[#111827] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Reports</span>
          </Link>
          <button
            onClick={loadReport}
            className="px-4 py-2 bg-[#204533] hover:bg-[#173326] text-white text-xs font-mono font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <ReportView report={report} isPublic={false} />;
}
