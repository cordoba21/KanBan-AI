"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "strong";
  glow?: "sky" | "purple" | "gradient" | "none";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = "default",
      glow = "none",
      hover = true,
      padding = "md",
      className = "",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseClass = variant === "strong" ? "glass-strong" : "glass";
    const glowClass =
      glow === "none"
        ? ""
        : glow === "sky"
        ? "glow-sky"
        : glow === "purple"
        ? "glow-purple"
        : "glow-gradient";

    return (
      <motion.div
        ref={ref}
        className={`${baseClass} ${glowClass} ${paddingMap[padding]} ${className}`}
        style={{
          borderRadius: "var(--radius-organic)",
          ...style,
        }}
        whileHover={
          hover
            ? {
                borderColor: "rgba(0, 255, 65, 0.25)",
                transition: { duration: 0.15 },
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";
export default GlassCard;
