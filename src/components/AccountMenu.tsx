"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AccountMenu({ solid }: { solid: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-2 transition-colors hover:bg-ink/10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.5 20c1.6-3.6 4.6-5.5 7.5-5.5s5.9 1.9 7.5 5.5" strokeLinecap="round" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`absolute right-0 top-full z-50 mt-3 w-56 rounded-md border border-ink/10 bg-paper p-4 text-ink shadow-xl ${
              solid ? "" : ""
            }`}
          >
            <p className="text-sm font-semibold">Welcome to SABSTATION</p>
            <p className="mt-1 text-xs text-ink/60">
              Accounts are coming soon. Check out as a guest for now.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-sm bg-ink/10 py-2 text-xs font-semibold uppercase tracking-wide text-ink/40"
              >
                Sign In
              </button>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-sm border border-ink/20 py-2 text-xs font-semibold uppercase tracking-wide text-ink/40"
              >
                Create Account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
