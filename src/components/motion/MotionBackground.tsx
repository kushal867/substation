"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CATEGORY_MOTION, type MotionCategory } from "@/lib/categoryMotion";
import ParticleField from "./ParticleField";
import LightSweep from "./LightSweep";
import MotionRibbon from "./MotionRibbon";
import { ShoeOutline, BagStrap, LensReflection } from "./CategoryMotif";

const MOTIF: Record<MotionCategory, typeof ShoeOutline | null> = {
  default: null,
  shoes: ShoeOutline,
  bags: BagStrap,
  glasses: LensReflection,
};

interface MotionBackgroundProps {
  category?: MotionCategory;
  className?: string;
  showMotif?: boolean;
}

/**
 * The living-campaign background: a slow cross-fading atmosphere gradient,
 * drifting particles, a traveling light ribbon, a soft grid, and — when a
 * category is active — that category's signature motion motif. Everything
 * here is transform/opacity driven and skips its loops under
 * prefers-reduced-motion (see the primitives themselves).
 */
export default function MotionBackground({
  category = "default",
  className = "",
  showMotif = true,
}: MotionBackgroundProps) {
  const config = CATEGORY_MOTION[category];
  const Motif = showMotif ? MOTIF[category] : null;

  return (
    <div aria-hidden="true" className={`bg-grain pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <AnimatePresence mode="sync">
        <motion.div
          key={category}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ background: `linear-gradient(200deg, ${config.from} 0%, ${config.to} 60%)` }}
        />
      </AnimatePresence>

      <LightSweep color={config.accentSoft} className="-left-24 top-[-12%] h-[420px] w-[420px]" duration={24} />
      <LightSweep color={config.accentSoft} className="right-[-10%] bottom-[-12%] h-[360px] w-[360px]" duration={30} />
      <ParticleField color={config.accent} />
      <MotionRibbon color={config.accent} className="top-1/2 -left-[20%] -rotate-6" />

      <AnimatePresence mode="wait">
        {Motif && <Motif key={category} color={config.accent} />}
      </AnimatePresence>

      <div
        className="animate-grid-drift absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(247,242,231,0.05) 1px, transparent 1px), linear-gradient(to right, rgba(247,242,231,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
