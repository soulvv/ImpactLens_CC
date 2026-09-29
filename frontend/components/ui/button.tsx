import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "sage";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:pointer-events-none rounded-none text-xs tracking-wider uppercase";

    const sizeStyles = {
      sm: "h-8 px-3 text-[11px]",
      md: "h-9 px-4 text-xs",
      lg: "h-11 px-6 text-sm",
    };

    const variantStyles = {
      primary:
        "bg-[#111827] text-white hover:bg-[#1f2937] active:bg-[#030712] border border-[#111827]",
      secondary:
        "bg-[#F1EFEA] text-[#111827] hover:bg-[#E8E5DD] border border-[#E2DFD8]",
      outline:
        "bg-white text-[#111827] hover:bg-[#F8F7F4] border border-[#E2DFD8] hover:border-[#C8C4BC]",
      ghost:
        "bg-transparent text-[#4B5563] hover:text-[#111827] hover:bg-[#F1EFEA]",
      danger:
        "bg-[#991B1B] text-white hover:bg-[#7F1D1D] border border-[#991B1B]",
      sage:
        "bg-[#224836] text-white hover:bg-[#1B3A2B] active:bg-[#142C20] border border-[#224836]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
