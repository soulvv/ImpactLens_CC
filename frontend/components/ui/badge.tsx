import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "sage" | "amber" | "neutral" | "blue" | "danger";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "neutral",
  size = "md",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-mono uppercase tracking-wider font-semibold rounded-none border";

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 leading-none",
    md: "text-[11px] px-2 py-0.5 leading-none",
  };

  const variantStyles = {
    sage: "bg-[#EAF2EC] text-[#224836] border-[#B8D4C0]",
    amber: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
    blue: "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]",
    danger: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    neutral: "bg-[#F1EFEA] text-[#374151] border-[#E2DFD8]",
  };

  return (
    <span
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
};
