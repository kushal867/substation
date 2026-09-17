"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import ProductVisual from "./ProductVisual";
import Reveal from "./Reveal";

const STATS = [
  { value: "2019", label: "Founded" },
  { value: "40+", label: "Countries shipped" },
  { value: "120K", label: "Happy customers" },
  { value: "3", label: "Categories obsessed over" },
];

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yFront = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [-24, 24]);
  const yBack = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [24, -24]);

  return (
    <section ref={ref} className="bg-ink py-24 text-cream">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
        <Reveal>
          <div className="grid h-full grid-cols-2 gap-4">
            <motion.div style={{ y: yFront }} className="relative mt-10 aspect-[3/4] overflow-hidden rounded-md">
              <ProductVisual category="shoes" colorHex="#d7ff3f" seed="story-1" className="h-full w-full" />
            </motion.div>
            <motion.div style={{ y: yBack }} className="relative aspect-[3/4] overflow-hidden rounded-md">
              <ProductVisual category="bags" colorHex="#ff5a1f" seed="story-2" className="h-full w-full" />
            </motion.div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime">
            Our Story
          </p>
          <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
            Designed for the ones who don&apos;t wait for permission.
          </h2>
          <p className="mt-6 max-w-lg text-cream/70">
            SABSTATION started in a single studio with one belief: the gear
            you carry every day should feel as sharp as the goals you&apos;re
            chasing. From footwear to bags to eyewear, every product goes
            through the same filter — does it move with you, or against you.
          </p>
          <p className="mt-4 max-w-lg text-cream/70">
            No seasonal filler. No disposable trends. Just considered pieces
            built with better materials, refined silhouettes, and details
            that hold up under real use.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-black text-lime">{stat.value}</dd>
                <p className="mt-1 text-xs uppercase tracking-wide text-cream/60">{stat.label}</p>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
