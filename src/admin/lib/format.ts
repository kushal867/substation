export const npr = (n: number) =>
  "NPR " + Math.round(n).toLocaleString("en-IN");

export const nprCompact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 10_000_000) return `NPR ${(n / 10_000_000).toFixed(1)}Cr`;
  if (a >= 100_000) return `NPR ${(n / 100_000).toFixed(1)}L`;
  if (a >= 1_000) return `NPR ${(n / 1_000).toFixed(1)}k`;
  return `NPR ${Math.round(n)}`;
};

export const num = (n: number) => Math.round(n).toLocaleString("en-IN");

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtShort = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export const toInputDate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const fromInputDate = (s: string, endOfDay = false) => {
  const [y, m, d] = s.split("-").map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const pct = (cur: number, prev: number) => {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return ((cur - prev) / prev) * 100;
};

export const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
};
