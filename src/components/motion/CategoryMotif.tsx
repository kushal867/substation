"use client";

import { motion, useReducedMotion } from "framer-motion";

interface MotifProps {
  color?: string;
  className?: string;
}

/** Slow-rotating shoe line-art with a pulsing lace/tread detail — the Shoes atmosphere. */
export function ShoeOutline({ color = "#b6905a", className = "" }: MotifProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 240 140"
      className={`pointer-events-none absolute right-[-6%] top-1/4 h-auto w-[46vw] max-w-[560px] opacity-[0.16] ${className}`}
      animate={shouldReduceMotion ? {} : { rotate: [-3, 2, -3], y: [0, -12, 0] }}
      transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
    >
      <g fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 116 Q12 96 34 88 L58 56 Q78 36 112 40 L168 45 Q202 50 218 80 Q228 98 217 112 Q211 121 196 121 Z" />
        <path d="M18 116 Q120 133 224 110" />
        <motion.path
          d="M72 52 L88 92 M98 44 L112 90 M124 43 L136 88"
          animate={shouldReduceMotion ? {} : { opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>
    </motion.svg>
  );
}

/** A bag silhouette with a strap that slowly breathes and a stitch line that draws itself. */
export function BagStrap({ color = "#a06a44", className = "" }: MotifProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 240 240"
      className={`pointer-events-none absolute right-[0%] top-[6%] h-auto w-[38vw] max-w-[440px] opacity-[0.16] ${className}`}
      animate={shouldReduceMotion ? {} : { y: [0, 14, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      <g fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <rect x="42" y="96" width="156" height="114" rx="14" />
        <path d="M78 96 C78 40 162 40 162 96" />
        <motion.path
          d="M42 150 L198 150"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { pathLength: 1, opacity: 0.6 } : { pathLength: [0, 1, 1], opacity: [0, 0.7, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>
    </motion.svg>
  );
}

/** Two lens circles with a light highlight sweeping across, clipped to the lens shapes. */
export function LensReflection({ color = "#cdc5b4", className = "" }: MotifProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 140"
      className={`pointer-events-none absolute right-[-2%] top-1/3 h-auto w-[40vw] max-w-[480px] opacity-[0.18] ${className}`}
    >
      <defs>
        <clipPath id="lens-clip">
          <circle cx="68" cy="72" r="40" />
          <circle cx="172" cy="72" r="40" />
        </clipPath>
      </defs>
      <g fill="none" stroke={color} strokeWidth={1.2}>
        <circle cx="68" cy="72" r="40" />
        <circle cx="172" cy="72" r="40" />
        <path d="M108 66 Q120 56 132 66" strokeLinecap="round" />
        <circle cx="68" cy="72" r="52" opacity="0.35" />
        <circle cx="172" cy="72" r="52" opacity="0.35" />
      </g>
      {!shouldReduceMotion && (
        <motion.rect
          x={-40}
          y={0}
          width={40}
          height={140}
          fill={color}
          opacity={0.3}
          clipPath="url(#lens-clip)"
          animate={{ x: [-40, 260] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
        />
      )}
    </svg>
  );
}
