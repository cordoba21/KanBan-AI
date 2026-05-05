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
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-2.5 text-sm",
  };

  const variantClasses = {
    primary: "liquid-button",
    ghost:
      "bg-transparent border border-[rgba(0,255,65,0.1)] text-[#00FF41]/60 hover:text-[#00FF41] hover:bg-[rgba(0,255,65,0.05)] hover:border-[rgba(0,255,65,0.3)]",
    danger:
      "bg-[rgba(255,59,59,0.08)] border border-[rgba(255,59,59,0.2)] text-[#FF3B3B] hover:bg-[rgba(255,59,59,0.15)] hover:border-[rgba(255,59,59,0.4)]",
  };

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-150 cursor-pointer uppercase tracking-wider
        disabled:opacity-30 disabled:cursor-not-allowed
        ${variant === "primary" ? "" : `rounded-[var(--radius-organic-sm)] ${variantClasses[variant]}`}
        ${variant === "primary" ? variantClasses[variant] : ""}
        ${sizeClasses[size]}
        ${className}
      `}
      whileHover={
        disabled
          ? undefined
          : { transition: { duration: 0.1 } }
      }
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled || loading}
      {...(props as Record<string, unknown>)}
    >
      {loading && (
        <span className="animate-terminal-blink text-[#00FF41]">█</span>
      )}
      <span className="inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
