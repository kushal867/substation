import clsx from "clsx";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-xl border border-a-line bg-a-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-wrap items-start justify-between gap-2 px-5 pt-4", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-a-fg">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-a-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
