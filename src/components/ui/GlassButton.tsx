"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function GlassButton({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  const variantClasses = {
    primary: "liquid-button",
    ghost:
      "bg-transparent border border-[rgba(255,255,255,0.1)] text-white/70 hover:text-white hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]",
    danger:
      "bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.25)] text-red-400 hover:bg-[rgba(248,113,113,0.2)]",
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-300 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variant === "primary" ? "" : `rounded-[var(--radius-organic-sm)] ${variantClasses[variant]}`}
        ${variant === "primary" ? variantClasses[variant] : ""}
        ${sizeClasses[size]}
        ${className}
      `}
      whileHover={
        disabled
          ? undefined
          : { scale: 1.02, transition: { duration: 0.2 } }
      }
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      {...(props as Record<string, unknown>)}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <span>{children}</span>
    </motion.button>
  );
}
