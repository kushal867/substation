import { useState } from "react";
import type { SortState } from "../components/ui/DataTable";

export function useTableSort(initial: SortState) {
  const [sort, setSort] = useState<SortState>(initial);
  const toggle = (key: string) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  return { sort, setSort, toggle };
}
