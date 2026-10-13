type Cell = string | number | boolean | null | undefined;

const esc = (v: Cell) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

/** Builds a CSV in the browser and triggers a download. */
export function downloadCsv(filename: string, rows: Cell[][]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
