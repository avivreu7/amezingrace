"use client";
import { ButtonHTMLAttributes } from "react";

type Variant = "mustard" | "red" | "ghost" | "charcoal";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  mustard:  "bg-mustard text-charcoal border-2 border-charcoal hover:bg-mustard-dark active:scale-95 shadow-[3px_3px_0px_#1A1A1A]",
  red:      "bg-race-red text-white border-2 border-charcoal hover:bg-race-red-dark active:scale-95 shadow-[3px_3px_0px_#1A1A1A]",
  charcoal: "bg-charcoal text-mustard border-2 border-charcoal hover:bg-charcoal-soft active:scale-95 shadow-[3px_3px_0px_#E8B400]",
  ghost:    "bg-transparent text-charcoal border-2 border-charcoal hover:bg-mustard-light active:scale-95",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm font-bold",
  md: "px-6 py-3 text-base font-bold",
  lg: "px-8 py-4 text-lg font-extrabold tracking-wide",
};

export default function Button({
  variant = "mustard",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "rounded-lg transition-all duration-100 select-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          טוען...
        </span>
      ) : children}
    </button>
  );
}
