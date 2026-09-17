import Link from "next/link";
import ProductImage from "./ProductImage";
import Reveal from "./Reveal";

const CATEGORIES = [
  {
    key: "shoes",
    label: "Shoes",
    href: "/shoes",
    image: "/images/shoes/cover/1.jpg",
    hex: "#d7ff3f",
    copy: "Built for movement.",
  },
  {
    key: "bags",
    label: "Bags",
    href: "/bags",
    image: "/images/bags/cover/1.jpg",
    hex: "#ff5a1f",
    copy: "Carry it with confidence.",
  },
  {
    key: "glasses",
    label: "Glasses",
    href: "/glasses",
    image: "/images/glasses/cover/1.jpg",
    hex: "#c7cbd1",
    copy: "See the city clearly.",
  },
] as const;

export default function CategoryShowcase() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-20 sm:px-6 lg:px-10">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
          The Lineup
        </p>
        <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Shop by Category
        </h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <Reveal key={cat.key} delay={i * 0.1}>
            <Link
              href={cat.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-ink"
            >
              <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                <ProductImage
                  src={cat.image}
                  alt={cat.label}
                  category={cat.key}
                  colorHex={cat.hex}
                  seed={cat.key}
                  sizes="(min-width: 640px) 33vw, 100vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent transition-opacity duration-500 group-hover:opacity-90" />

              <span className="absolute left-6 top-6 font-display text-xs font-bold uppercase tracking-[0.3em] text-cream/60">
                0{i + 1}
              </span>

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 transition-transform duration-500 ease-out group-hover:-translate-y-1.5">
                <div>
                  <h3 className="font-display text-3xl font-black uppercase tracking-tight text-cream">
                    {cat.label}
                  </h3>
                  <p className="mt-1 text-sm text-cream/70">{cat.copy}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H9M17 7V15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
