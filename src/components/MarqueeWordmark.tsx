"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export default function MarqueeWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? ["0%", "0%"] : ["6%", "-14%"]);

  return (
    <div ref={ref} aria-hidden="true" className="relative overflow-hidden bg-cream py-6 sm:py-10">
      <motion.p
        style={{ x }}
        className="text-outline whitespace-nowrap font-display text-[16vw] font-black uppercase leading-none tracking-tight opacity-[0.08] sm:text-[12vw]"
      >
        SABSTATION · SABSTATION · SABSTATION
      </motion.p>
    </div>
  );
}
