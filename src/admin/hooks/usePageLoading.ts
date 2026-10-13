import { useEffect, useState } from "react";

/** Brief skeleton state on page entry — gives loading-style feedback for the mock data. */
export function usePageLoading(ms = 350) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
