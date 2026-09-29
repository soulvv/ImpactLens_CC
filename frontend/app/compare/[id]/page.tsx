"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Comparison } from "@/types";
import { getComparisonById } from "@/lib/api";
import { ComparisonViewer } from "@/components/compare/comparison-viewer";
import { Button } from "@/components/ui/button";

export default function ComparisonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadComparison();
    }
  }, [id]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getComparisonById(id);
      setComparison(data);
    } catch (err: any) {
      console.error("Failed to load comparison:", err);
      setErrorMsg(err.message || "Failed to locate comparison record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between border-b border-[#E2DFD8] pb-4">
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-[#4B5563] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Impact Comparisons</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={loadComparison}
          loading={loading}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Record</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-16 text-center border border-[#E2DFD8] bg-white text-xs font-mono text-[#6B7280]">
          Loading field comparison record {id}...
        </div>
      ) : errorMsg ? (
        <div className="p-8 border border-[#FECACA] bg-[#FEE2E2] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#991B1B] mx-auto" />
          <h2 className="text-sm font-mono uppercase font-bold text-[#991B1B]">
            Comparison Record Not Found
          </h2>
          <p className="text-xs text-[#7F1D1D] max-w-md mx-auto">{errorMsg}</p>
          <div className="pt-2">
            <Link href="/compare">
              <Button variant="outline" size="sm">
                Return to Comparisons Repository
              </Button>
            </Link>
          </div>
        </div>
      ) : comparison ? (
        <ComparisonViewer
          comparison={comparison}
          onRefresh={loadComparison}
          onDeleted={() => router.push("/compare")}
        />
      ) : null}
    </div>
  );
}
