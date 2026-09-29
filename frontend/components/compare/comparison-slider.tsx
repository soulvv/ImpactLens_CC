"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { getMediaAssetUrl } from "@/lib/api";

interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
  aspectRatio?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeUrl,
  afterUrl,
  beforeAlt = "Baseline before evidence",
  afterAlt = "Subsequent after evidence",
  className = "",
  aspectRatio = "aspect-video"
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  const bUrl = getMediaAssetUrl(beforeUrl);
  const aUrl = getMediaAssetUrl(afterUrl);

  const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%231f2937'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='%2310b981' text-anchor='middle'>Field Evidence</text></svg>";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={handleKeyDown}
      className={`relative select-none overflow-hidden bg-neutral-900 border border-[#E2DFD8] focus:outline-none focus:ring-2 focus:ring-[#204533] cursor-ew-resize ${aspectRatio} ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* AFTER Image (Full background layer) */}
      <img
        src={aUrl}
        alt={afterAlt}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackSvg;
        }}
      />

      {/* Floating AFTER Badge */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="px-2.5 py-1 rounded-xs bg-[#111827]/85 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono uppercase font-bold tracking-wider backdrop-blur-xs">
          AFTER (Survey)
        </span>
      </div>

      {/* BEFORE Image (Clipped overlay layer) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={bUrl}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%", maxWidth: "none" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackSvg;
          }}
        />

        {/* Floating BEFORE Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-xs bg-[#111827]/85 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase font-bold tracking-wider backdrop-blur-xs">
            BEFORE (Baseline)
          </span>
        </div>
      </div>

      {/* Vertical Divider Line & Central Grip Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Hairline Divider */}
        <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />

        {/* Circular Grip Knob */}
        <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-[#111827] shadow-lg border border-[#111827]/20 flex items-center justify-center pointer-events-auto hover:scale-105 active:scale-95 transition-transform">
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-bold">◀</span>
            <span className="text-[10px] font-bold">▶</span>
          </div>
        </div>
      </div>

      {/* Keyboard Hint Pill */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-2 py-0.5 rounded bg-black/60 text-white/70 text-[9px] font-mono backdrop-blur-xs">
        Drag or use ◀ / ▶ keys
      </div>
    </div>
  );
};
