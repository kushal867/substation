"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

function useOverlay(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      const el = ref.current;
      const first = el?.querySelector<HTMLElement>("[data-autofocus], input, select, textarea");
      (first ?? el)?.focus();
    }, 30);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return ref;
}

const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: keyof typeof sizes;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, size = "md", footer, children }: ModalProps) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="admin-root fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4" style={{ background: "transparent" }}>
      <div className="a-fade-in absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={clsx("a-pop-in relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-a-line bg-a-surface shadow-2xl outline-none sm:rounded-2xl", sizes[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-a-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-a-fg">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-a-muted">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-a-line bg-a-subtle/60 px-5 py-3 sm:rounded-b-2xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, actions, width = "max-w-xl", footer, children }: DrawerProps) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="admin-root fixed inset-0 z-[70]" style={{ background: "transparent" }}>
      <div className="a-fade-in absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={clsx("a-slide-in absolute inset-y-0 right-0 flex w-full flex-col border-l border-a-line bg-a-surface shadow-2xl outline-none", width)}
      >
        <div className="flex items-start justify-between gap-3 border-b border-a-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-a-fg">{title}</h2>
            {subtitle && <div className="mt-1 text-sm text-a-muted">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-a-line bg-a-subtle/60 px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}
