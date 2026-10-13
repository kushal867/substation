import { useMemo, useState } from "react";
import { toInputDate } from "../lib/format";
import { presetRange, type PeriodKey } from "../lib/range";

export function useDateRange(initial: PeriodKey = "30") {
  const [key, setKey] = useState<PeriodKey>(initial);
  const today = toInputDate(new Date());
  const monthAgo = toInputDate(new Date(Date.now() - 29 * 86_400_000));
  const [custom, setCustom] = useState({ from: monthAgo, to: today });
  const range = useMemo(() => presetRange(key, custom), [key, custom]);
  return { key, setKey, custom, setCustom, range };
}
export type DateRangeState = ReturnType<typeof useDateRange>;
