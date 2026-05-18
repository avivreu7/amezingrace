"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  shake?: boolean;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, shake = false, className = "", ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-sm font-bold text-charcoal uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={[
          "w-full px-4 py-3 text-lg font-bold rounded-lg border-2",
          "bg-white text-charcoal placeholder-charcoal/40",
          "focus:outline-none focus:ring-2 focus:ring-mustard",
          error
            ? "border-race-red focus:ring-race-red"
            : "border-charcoal",
          shake ? "animate-shake" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && (
        <p className="text-sm font-semibold text-race-red">{error}</p>
      )}
    </div>
  );
});

export default Input;
