"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PrintCtx = createContext<((node: React.ReactNode) => void) | null>(null);

/**
 * Renders a node into a body-level portal that is the only thing visible when printing,
 * then opens the browser print dialog. No popups needed.
 */
export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [node, setNode] = useState<React.ReactNode>(null);

  const print = useCallback((n: React.ReactNode) => setNode(n), []);

  useEffect(() => {
    if (!node) return;
    document.body.classList.add("a-printing");
    const cleanup = () => {
      document.body.classList.remove("a-printing");
      setNode(null);
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    const t = setTimeout(() => window.print(), 120);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", cleanup);
    };
  }, [node]);

  return (
    <PrintCtx.Provider value={print}>
      {children}
      {node && createPortal(<div id="a-print-root" style={{ background: "#fff", color: "#111", colorScheme: "light" }}>{node}</div>, document.body)}
    </PrintCtx.Provider>
  );
}

export function usePrint() {
  const c = useContext(PrintCtx);
  if (!c) throw new Error("usePrint outside PrintProvider");
  return c;
}
