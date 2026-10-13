"use client";

import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

/* ---------------- Toasts ---------------- */
type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastApi {
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}
const ToastCtx = createContext<ToastApi | null>(null);

/* ---------------- Confirm ---------------- */
export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary" | "warning";
  body?: React.ReactNode;
}
type ConfirmFn = (o: ConfirmOptions) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3800);
  }, []);
  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }),
    [push],
  );

  const [dlg, setDlg] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<ConfirmFn>((o) => new Promise<boolean>((resolve) => setDlg({ ...o, resolve })), []);
  const close = (v: boolean) => {
    dlg?.resolve(v);
    setDlg(null);
  };

  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const colors = { success: "text-emerald-500", error: "text-red-500", info: "text-sky-500" };

  return (
    <ToastCtx.Provider value={api}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        <div aria-live="polite" className="admin-root pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" style={{ background: "transparent" }}>
          {toasts.map((t) => {
            const Icon = icons[t.kind];
            return (
              <div key={t.id} role={t.kind === "error" ? "alert" : "status"} className="a-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-a-line bg-a-surface p-3 pr-2 text-sm text-a-fg shadow-lg">
                <Icon className={clsx("mt-0.5 h-4 w-4 shrink-0", colors[t.kind])} />
                <p className="min-w-0 flex-1">{t.message}</p>
                <button aria-label="Dismiss" className="rounded p-1 text-a-muted hover:bg-a-subtle" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <Modal
          open={!!dlg}
          onClose={() => close(false)}
          size="sm"
          title={
            <span className="flex items-center gap-2">
              {dlg?.tone !== "primary" && <AlertTriangle className={clsx("h-5 w-5", dlg?.tone === "warning" ? "text-amber-500" : "text-red-500")} />}
              {dlg?.title}
            </span>
          }
          footer={
            <>
              <Button onClick={() => close(false)}>{dlg?.cancelLabel ?? "Cancel"}</Button>
              <Button data-autofocus variant={dlg?.tone === "primary" || dlg?.tone === "warning" ? "primary" : "danger"} onClick={() => close(true)}>
                {dlg?.confirmLabel ?? "Confirm"}
              </Button>
            </>
          }
        >
          {dlg?.description && <p className="text-sm text-a-muted">{dlg.description}</p>}
          {dlg?.body}
        </Modal>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast outside FeedbackProvider");
  return c;
}
export function useConfirm() {
  const c = useContext(ConfirmCtx);
  if (!c) throw new Error("useConfirm outside FeedbackProvider");
  return c;
}
