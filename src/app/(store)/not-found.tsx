import Link from "next/link";
import ProductVisual from "@/components/ProductVisual";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[75vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 h-40 w-40 overflow-hidden rounded-full">
        <ProductVisual category="glasses" colorHex="#111111" seed="404" className="h-full w-full" />
      </div>
      <p className="font-display text-8xl font-black tracking-tight text-ink/10 sm:text-9xl">
        404
      </p>
      <h1 className="-mt-6 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
        Lost the trail
      </h1>
      <p className="mt-3 max-w-md text-ink/60">
        We couldn&apos;t find the page you were looking for. It may have been
        moved, or the drop already sold out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
        >
          Back to Home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-ink/20 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-ink transition-colors hover:border-ink"
        >
          Shop All
        </Link>
      </div>
    </div>
  );
}
