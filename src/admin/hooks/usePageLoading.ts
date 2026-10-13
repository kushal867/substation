/** Data is loaded before any page renders (see AdminShell), so pages never need an artificial loading state. */
export function usePageLoading(_ms?: number) {
  void _ms;
  return false;
}
