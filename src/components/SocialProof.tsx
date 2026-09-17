import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";
import Reveal from "./Reveal";

function interleaveByCategory(products: Product[]): Product[] {
  const byCategory = new Map<string, Product[]>();
  for (const p of products) {
    const bucket = byCategory.get(p.category) ?? [];
    bucket.push(p);
    byCategory.set(p.category, bucket);
  }
  const buckets = Array.from(byCategory.values());
  const result: Product[] = [];
  for (let i = 0; result.length < products.length && buckets.some((b) => i < b.length); i++) {
    for (const bucket of buckets) {
      if (bucket[i]) result.push(bucket[i]);
    }
  }
  return result;
}

export default function SocialProof({ products }: { products: Product[] }) {
  const tiles = interleaveByCategory(products).slice(0, 6);

  return (
    <section className="bg-ink py-20 text-cream sm:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-lime">
                Social Proof
              </p>
              <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
                @sabstation
              </h2>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold uppercase tracking-widest text-cream/70 underline underline-offset-4 hover:text-lime"
            >
              Follow Along
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {tiles.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.05}>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-sm bg-charcoal"
              >
                <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
                  <ProductImage
                    src={product.images[0]}
                    alt=""
                    category={product.category}
                    colorHex={product.colors[0].hex}
                    seed={`social-${product.id}`}
                    sizes="200px"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/50 group-hover:opacity-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-cream">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
