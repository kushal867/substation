"use client";

import { motion, useReducedMotion } from "framer-motion";

const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  left: `${(i * 37 + 8) % 100}%`,
  top: `${(i * 53 + 12) % 100}%`,
  size: 2 + (i % 3),
  duration: 14 + (i % 5) * 3,
  delay: i * 0.6,
}));

/** A handful of tiny particles drifting almost imperceptibly slowly. */
export default function ParticleField({ color = "#b6905a" }: { color?: string }) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, backgroundColor: color }}
          animate={{ y: [0, -22, 0], opacity: [0.12, 0.5, 0.12] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
