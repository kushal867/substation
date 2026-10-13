import type { Metadata } from "next";
import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";
import Reveal from "@/components/Reveal";
import Newsletter from "@/components/Newsletter";

export const metadata: Metadata = {
  title: "About — SABSTATION",
};

const VALUES = [
  {
    title: "Built for Movement",
    copy: "Every piece is tested against real days, not just photoshoots — commutes, flights, late nights, early starts.",
  },
  {
    title: "Material First",
    copy: "We source recycled and responsibly-made materials without compromising on how a product feels or wears in.",
  },
  {
    title: "Considered Design",
    copy: "No filler drops. Every silhouette earns its place in the lineup through iteration, not trend-chasing.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-ink px-4 pb-20 pt-32 text-cream sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime">
              About SABSTATION
            </p>
            <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Move Different. Carry Confidence. See Clear.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-cream/70">
              SABSTATION is a fashion accessories house built around three
              categories we refuse to treat as an afterthought: shoes, bags,
              and glasses. Founded in 2019, we design for people who want
              their gear to work as hard as they do.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Reveal>
            <div className="aspect-[4/5] overflow-hidden rounded-md">
              <ProductVisual category="shoes" colorHex="#d7ff3f" seed="about-1" className="h-full w-full" />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="aspect-[4/5] overflow-hidden rounded-md sm:mt-10">
              <ProductVisual category="bags" colorHex="#ff5a1f" seed="about-2" className="h-full w-full" />
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="aspect-[4/5] overflow-hidden rounded-md">
              <ProductVisual category="glasses" colorHex="#c7cbd1" seed="about-3" className="h-full w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream-dark py-20">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <Reveal>
            <h2 className="max-w-2xl font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              What we stand for
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {VALUES.map((value, i) => (
              <Reveal key={value.title} delay={i * 0.1}>
                <span className="font-display text-3xl font-black text-orange">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{value.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Have a question before you shop?
          </h2>
          <p className="mt-3 text-ink/60">
            Our team is happy to help with sizing, materials, or your order.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
          >
            Contact Us
          </Link>
        </Reveal>
      </section>

      <Newsletter />
    </div>
  );
}
