import clsx from "clsx";

export type Tone = "gray" | "green" | "amber" | "red" | "blue" | "violet" | "indigo" | "sky";

const tones: Record<Tone, string> = {
  gray: "bg-gray-500/10 text-gray-700 dark:text-gray-300 ring-gray-500/20",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/25",
  red: "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-500/20",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20",
};

export function Badge({ tone = "gray", dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const ORDER_TONE = { Pending: "amber", Confirmed: "blue", Processing: "violet", Shipped: "sky", Delivered: "green", Cancelled: "red" } as const;
export const PAY_TONE = { Unpaid: "red", "Partially Paid": "amber", Paid: "green", Refunded: "gray" } as const;
export const TXN_TONE = { Pending: "amber", Verified: "green", Failed: "red", Refunded: "gray" } as const;
export const STOCK_TONE = { in: "green", low: "amber", out: "red" } as const;
