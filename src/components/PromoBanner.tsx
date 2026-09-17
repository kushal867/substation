const MESSAGES = [
  "FREE SHIPPING OVER $150",
  "NEW DROPS EVERY MONTH",
  "SUSTAINABLY MADE MATERIALS",
  "30-DAY RETURNS",
];

export default function PromoBanner() {
  const loop = [...MESSAGES, ...MESSAGES];
  return (
    <div className="overflow-hidden border-y border-ink/10 bg-lime py-3.5 text-ink">
      <div className="flex w-max animate-marquee whitespace-nowrap motion-reduce:animate-none">
        {loop.map((msg, i) => (
          <span
            key={i}
            className="mx-6 flex items-center gap-6 text-xs font-bold uppercase tracking-[0.25em]"
          >
            {msg}
            <span aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
