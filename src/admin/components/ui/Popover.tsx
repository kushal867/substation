"use client";

import clsx from "clsx";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
  triggerClassName?: string;
  label?: string;
}

/** Portal based popover so it is never clipped by scrolling table containers. */
export function Popover({ trigger, children, align = "end", className, triggerClassName, label }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const p: typeof pos = {};
    if (below < 280 && r.top > below) p.bottom = window.innerHeight - r.top + 6;
    else p.top = r.bottom + 6;
    if (align === "end") p.right = Math.max(8, window.innerWidth - r.right);
    else p.left = Math.max(8, r.left);
    setPos(p);
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || wrap.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onScroll = (e: Event) => {
      if (panel.current && e.target instanceof Node && panel.current.contains(e.target)) return;
      close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  return (
    <>
      <span
        ref={wrap}
        className={clsx("inline-flex", triggerClassName)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {trigger}
      </span>
      {open &&
        createPortal(
          <div className="admin-root contents" style={{ background: "transparent" }}>
            <div
              ref={panel}
              id={id}
              style={{ position: "fixed", zIndex: 90, ...pos }}
              onClick={(e) => e.stopPropagation()}
              className={clsx("a-pop-in rounded-xl border border-a-line bg-a-surface text-a-fg shadow-xl", className)}
            >
              {children(close)}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export function Menu({ trigger, items, label = "Actions", align = "end" }: { trigger: React.ReactNode; items: MenuItem[]; label?: string; align?: "start" | "end" }) {
  return (
    <Popover trigger={trigger} align={align} label={label} className="w-48 p-1">
      {(close) => (
        <div role="menu">
          {items.map((it, i) => (
            <div key={i}>
              {it.divider && <div className="my-1 h-px bg-a-line" />}
              <button
                role="menuitem"
                disabled={it.disabled}
                onClick={() => {
                  close();
                  it.onClick();
                }}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors disabled:opacity-40",
                  it.danger ? "text-red-600 hover:bg-red-500/10 dark:text-red-400" : "text-a-fg hover:bg-a-subtle",
                )}
              >
                {it.icon && <span className="h-4 w-4 text-current opacity-70 [&>svg]:h-4 [&>svg]:w-4">{it.icon}</span>}
                {it.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </Popover>
  );
}

export function Tooltip({ text, children, side = "top" }: { text: string; children: React.ReactNode; side?: "top" | "right" }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(side === "top" ? { x: r.left + r.width / 2, y: r.top - 8 } : { x: r.right + 10, y: r.top + r.height / 2 });
  };
  return (
    <span ref={ref} className="inline-flex" onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}>
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", left: pos.x, top: pos.y, transform: side === "top" ? "translate(-50%, -100%)" : "translateY(-50%)", zIndex: 120 }}
            className="pointer-events-none whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
          >
            {text}
          </div>,
          document.body,
        )}
    </span>
  );
}
