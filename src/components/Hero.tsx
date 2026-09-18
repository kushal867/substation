"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import ProductImage from "./ProductImage";
import MotionBackground from "./motion/MotionBackground";

const LINES = ["MOVE DIFFERENT.", "CARRY CONFIDENCE.", "SEE CLEAR."];

const FLOATERS = [
  {
    key: "shoes",
    href: "/shoes",
    image: "/images/shoes/cover/1.jpg",
    hex: "#b6905a",
    floatClass: "animate-float-a",
    className: "left-0 top-4 h-40 w-32 sm:h-52 sm:w-40 lg:h-60 lg:w-44",
  },
  {
    key: "bags",
    href: "/bags",
    image: "/images/bags/cover/1.jpg",
    hex: "#a06a44",
    floatClass: "animate-float-b",
    className: "right-2 top-0 h-36 w-36 sm:h-44 sm:w-44 lg:h-52 lg:w-52",
  },
  {
    key: "glasses",
    href: "/glasses",
    image: "/images/glasses/cover/1.jpg",
    hex: "#cdc5b4",
    floatClass: "animate-float-c",
    className: "bottom-0 left-1/4 h-28 w-40 sm:h-32 sm:w-48 lg:h-36 lg:w-56",
  },
] as const;

const TICKER_ITEMS = ["SHOES", "BAGS", "GLASSES", "SABSTATION"];

export default function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const shoeX = useTransform(pointerX, [-0.5, 0.5], [-26, 26]);
  const shoeY = useTransform(pointerY, [-0.5, 0.5], [-16, 16]);
  const bagX = useTransform(pointerX, [-0.5, 0.5], [-40, 40]);
  const bagY = useTransform(pointerY, [-0.5, 0.5], [-24, 24]);
  const glassesX = useTransform(pointerX, [-0.5, 0.5], [-18, 18]);
  const glassesY = useTransform(pointerY, [-0.5, 0.5], [-10, 10]);
  const parallax = { shoes: { x: shoeX, y: shoeY }, bags: { x: bagX, y: bagY }, glasses: { x: glassesX, y: glassesY } };

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  const loopTicker = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section className="bg-grain relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden text-cream">
      {/* Living background — continuous motion, never static */}
      <MotionBackground category="default" showMotif={false} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />

      <div
        className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-center gap-10 px-4 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-14 lg:pt-24"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Text column */}
        <div className="relative flex flex-col justify-center py-4 lg:py-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-lime sm:mb-6"
          >
            SABSTATION — Shoes / Bags / Glasses
          </motion.p>

          <div className="relative">
            <h1
              aria-hidden="true"
              className="text-outline-cream pointer-events-none absolute -top-3 left-1 select-none font-display text-[clamp(1.75rem,3.6vw,3.75rem)] font-black uppercase leading-[1.05] tracking-tight sm:-top-4"
            >
              {LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <h1 className="relative font-display text-[clamp(1.75rem,3.6vw,3.75rem)] font-black uppercase leading-[1.05] tracking-tight">
              {LINES.map((line, i) => (
                <span key={line} className="block overflow-hidden py-0.5">
                  <motion.span
                    className="block"
                    initial={{ y: shouldReduceMotion ? 0 : "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.9,
                      delay: 0.15 * i + 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-5 font-display text-lg italic text-cream/60 sm:text-xl"
          >
            For the ones who move different.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-4 max-w-md text-base text-cream/85 sm:text-lg"
          >
            Premium shoes, bags, and eyewear built for people who move
            through the city like it owes them something.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3 sm:mt-10"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Link
                href="/shop"
                className="inline-flex rounded-full bg-lime px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-ink"
              >
                Shop All
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Link
                href="/about"
                className="group relative inline-flex overflow-hidden rounded-full border border-cream/30 px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-cream"
              >
                <span className="relative z-10">Our Story</span>
                <span className="absolute inset-0 origin-left scale-x-0 bg-cream/10 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating visual composition */}
        <div className="relative hidden h-[420px] sm:h-[480px] lg:block lg:h-[560px]">
          {FLOATERS.map((floater, i) => (
            <motion.div
              key={floater.key}
              className={`absolute ${floater.className}`}
              style={{ x: shouldReduceMotion ? 0 : parallax[floater.key].x, y: shouldReduceMotion ? 0 : parallax[floater.key].y }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={floater.href} aria-label={`Shop ${floater.key}`}>
                <div className={shouldReduceMotion ? "" : floater.floatClass}>
                  <div className="relative h-full w-full overflow-hidden rounded-lg border border-cream/10 shadow-2xl shadow-black/40 ring-1 ring-white/5">
                    <ProductImage
                      src={floater.image}
                      alt=""
                      category={floater.key}
                      colorHex={floater.hex}
                      seed={`hero-${floater.key}`}
                      sizes="240px"
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-lime/10 blur-[100px]"
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        className="relative z-10 flex justify-center pb-4"
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-cream/50"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="14" height="22" rx="7" />
            <circle cx="8" cy="7" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Ticker */}
      <div className="relative z-10 overflow-hidden border-t border-cream/10 bg-black/30 py-3 backdrop-blur-sm">
        <div className="flex w-max animate-marquee-fast whitespace-nowrap motion-reduce:animate-none">
          {loopTicker.map((word, i) => (
            <span
              key={i}
              className="mx-5 flex items-center gap-5 font-display text-sm font-bold uppercase tracking-[0.3em] text-cream/60"
            >
              {word}
              <span className="text-lime" aria-hidden="true">
                ●
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
