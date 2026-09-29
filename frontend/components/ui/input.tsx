import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = "text", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-1.5 font-mono">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-none border border-[#E2DFD8] bg-white px-3 py-1.5 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#111827] disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-sans",
            error && "border-[#991B1B] focus:border-[#991B1B]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[11px] text-[#991B1B] font-mono">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
