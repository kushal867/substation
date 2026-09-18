"use client";

import { motion, useReducedMotion } from "framer-motion";

/** A thin light trail that continuously travels across its container. */
export default function MotionRibbon({
  color,
  className = "",
  duration = 9,
}: {
  color: string;
  className?: string;
  duration?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute h-px w-[140%] ${className}`}
      style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      initial={{ x: "-100%" }}
      animate={{ x: "0%" }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    />
  );
}
