"use client";

import { motion, useReducedMotion } from "framer-motion";

/** A large, softly blurred glow that drifts very slowly — the atmosphere's light source. */
export default function LightSweep({
  color,
  className = "",
  duration = 26,
}: {
  color: string;
  className?: string;
  duration?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      style={{ background: color }}
      animate={shouldReduceMotion ? {} : { x: [0, 50, -20, 0], y: [0, -30, 20, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
