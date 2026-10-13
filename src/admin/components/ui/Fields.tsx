"use client";

import clsx from "clsx";
import { Search, X } from "lucide-react";
import { forwardRef, useEffect, useId, useRef } from "react";

const baseInput =
  "h-9 rounded-lg border border-a-line bg-a-surface px-3 text-sm text-a-fg placeholder:text-a-muted/70 transition-colors focus:border-a-accent focus:outline-none focus:ring-2 focus:ring-a-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
export const inputCls = baseInput + " w-full";

interface FieldProps {
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (id: string) => React.ReactNode;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-a-fg">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-a-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; error?: string; hint?: React.ReactNode; wrapperClassName?: string };

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField({ label, error, hint, wrapperClassName, className, required, ...rest }, ref) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(id) => <input ref={ref} id={id} aria-invalid={!!error} className={clsx(inputCls, error && "border-red-500 focus:border-red-500 focus:ring-red-500/20", className)} {...rest} />}
    </Field>
  );
});

type TAProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: React.ReactNode; error?: string; hint?: React.ReactNode; wrapperClassName?: string };
export function TextArea({ label, error, hint, wrapperClassName, className, required, ...rest }: TAProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(id) => <textarea id={id} aria-invalid={!!error} rows={3} className={clsx(inputCls, "h-auto py-2", error && "border-red-500", className)} {...rest} />}
    </Field>
  );
}

type SelProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: React.ReactNode; error?: string; hint?: React.ReactNode; wrapperClassName?: string };
export function SelectField({ label, error, hint, wrapperClassName, className, required, children, ...rest }: SelProps) {
  return (
    <Field label={label ?? ""} error={error} hint={hint} required={required} className={wrapperClassName}>
      {(id) => (
        <select id={id} aria-invalid={!!error} className={clsx(inputCls, "pr-8", error && "border-red-500", className)} {...rest}>
          {children}
        </select>
      )}
    </Field>
  );
}

/** Compact select for toolbars (no label, accessible via aria-label). */
export function FilterSelect({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { "aria-label": string }) {
  return (
    <select className={clsx(baseInput, "w-auto min-w-[8rem] pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className, "aria-label": al }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; "aria-label"?: string }) {
  return (
    <div className={clsx("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-a-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={al ?? placeholder}
        className={clsx(inputCls, "pl-9", value && "pr-8", "[&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-a-muted hover:text-a-fg">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-a-accent" : "bg-gray-300 dark:bg-slate-600",
      )}
    >
      <span className={clsx("inline-block rounded-full bg-white shadow transition-transform", size === "sm" ? "h-4 w-4" : "h-5 w-5", checked ? (size === "sm" ? "translate-x-[18px]" : "translate-x-[22px]") : "translate-x-0.5")} />
    </button>
  );
}

export function Checkbox({ checked, indeterminate, onChange, label, className }: { checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={clsx("h-4 w-4 cursor-pointer rounded border-a-line accent-[var(--a-accent)]", className)}
    />
  );
}
