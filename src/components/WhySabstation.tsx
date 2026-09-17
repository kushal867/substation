import Reveal from "./Reveal";

const PILLARS = [
  {
    title: "Curated Style",
    copy: "Every silhouette is chosen for how it reads on the street, not just on a shelf.",
    icon: (
      <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2-4.8-4.3 6.4-.6L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Premium Quality",
    copy: "Full-grain leathers, recycled technical fabrics, and hardware built to outlast trends.",
    icon: (
      <>
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "City-Ready Design",
    copy: "Engineered for commutes, flights, and late nights — not just photoshoots.",
    icon: (
      <>
        <path d="M4 21V9l8-6 8 6v12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Secure Delivery",
    copy: "Tracked, insured shipping with a 30-day return window on every order.",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11h18M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function WhySabstation() {
  return (
    <section className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
            Why SABSTATION
          </p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Built different, on purpose.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <div className="flex h-full flex-col border-t-2 border-ink pt-5">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="text-ink"
                >
                  {pillar.icon}
                </svg>
                <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-ink/60">{pillar.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
