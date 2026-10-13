import { useEffect, useRef, useState } from "react";

/** Flips to true for a short moment whenever `dep` changes (filter/period change feedback). */
export function useBriefLoading(dep: unknown, ms = 260) {
  const [busy, setBusy] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setBusy(true);
    const t = setTimeout(() => setBusy(false), ms);
    return () => clearTimeout(t);
  }, [dep, ms]);
  return busy;
}
