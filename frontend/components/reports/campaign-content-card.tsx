"use client";

import React, { useState } from "react";
import { Copy, Check, Share2, ShieldCheck } from "lucide-react";
import { CampaignContent, ReportEvidenceItem } from "@/types";

interface CampaignContentSectionProps {
  campaign: CampaignContent;
  evidenceItems?: ReportEvidenceItem[];
  onViewSources?: () => void;
}

export const CampaignContentSection: React.FC<CampaignContentSectionProps> = ({
  campaign,
  evidenceItems = [],
  onViewSources,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cards = [
    {
      key: "headline",
      label: "Campaign Headline",
      content: campaign.headline,
      hint: "High-impact title for press releases and executive briefs.",
    },
    {
      key: "short_summary",
      label: "Short Executive Summary",
      content: campaign.short_summary,
      hint: "Single-sentence factual overview for dashboards and decks.",
    },
    {
      key: "social_caption",
      label: "Social Media Caption",
      content: campaign.social_caption,
      hint: "Hashtag-ready copy for LinkedIn, X, and stakeholder announcements.",
    },
    {
      key: "impact_story",
      label: "Narrative Field Story",
      content: campaign.impact_story,
      hint: "Multi-sentence narrative grounded directly in submitted field photographs.",
    },
    {
      key: "sponsor_summary",
      label: "Sponsor & Donor Brief",
      content: campaign.sponsor_summary,
      hint: "Auditable synthesis designed for ESG reporting and grants.",
    },
    {
      key: "callout",
      label: "Key Callout Quote",
      content: campaign.callout,
      hint: "Pull quote suitable for annual publications and newsletters.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2DFD8]">
        <div>
          <h3 className="text-lg font-bold font-serif text-[#111827]">
            Campaign-Ready Content & Narrative Assets
          </h3>
          <p className="text-xs text-[#6B7280] font-sans mt-0.5">
            AI-synthesized outreach variants strictly faithful to verified ground media. Zero speculative claims.
          </p>
        </div>

        {onViewSources && (
          <button
            onClick={onViewSources}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#F1EFEA] hover:bg-[#EAE7DF] border border-[#E2DFD8] text-xs font-mono text-[#204533] font-semibold transition-colors shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>View Supporting Sources ({campaign.sources?.length || evidenceItems.length})</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const isCopied = copiedKey === card.key;
          return (
            <div
              key={card.key}
              className="bg-white border border-[#E2DFD8] p-5 flex flex-col justify-between hover:border-[#C8C4BC] transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#204533]">
                    {card.label}
                  </span>
                  <button
                    onClick={() => handleCopy(card.content, card.key)}
                    className="inline-flex items-center space-x-1 text-[11px] font-mono text-[#6B7280] hover:text-[#111827] px-2 py-0.5 bg-[#F8F7F4] border border-[#E2DFD8] hover:bg-[#EAE7DF] transition-colors"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#204533]" />
                        <span className="text-[#204533] font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#6B7280] font-sans italic">{card.hint}</p>

                <p className="text-sm font-sans text-[#111827] leading-relaxed pt-2 border-t border-[#F1EFEA]">
                  {card.content}
                </p>
              </div>

              {campaign.sources && campaign.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#F1EFEA] flex items-center justify-between text-[10px] font-mono text-[#9CA3AF]">
                  <span>Source-Backed</span>
                  <span>{campaign.sources.length} assets cited</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
