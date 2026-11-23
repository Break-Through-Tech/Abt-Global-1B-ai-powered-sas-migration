import { AlertTriangle, Check, CheckCircle2, Info, Star, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";

/** Filled ink stars with a text label for assistive tech. */
export function Stars({ value, size = 16 }: { value: number | null; size?: number }) {
  if (value === null) {
    return <span className="text-sm text-muted">Not rated</span>;
  }
  return (
    <span role="img" aria-label={`${value} of 5 stars`} className="inline-flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          width={size}
          height={size}
          strokeWidth={1.5}
          className={n <= value ? "fill-ink text-ink" : "fill-transparent text-line"}
        />
      ))}
    </span>
  );
}

/** Star-count label used in chart axes and filters: "4" plus a drawn star. */
export function StarLabel({ n, size = 12 }: { n: number | string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {n}
      <Star aria-hidden width={size} height={size} strokeWidth={1.5} className="fill-current" />
      <span className="sr-only">stars</span>
    </span>
  );
}

/** A titled region separated by a rule, Abt-style: no card chrome. */
export function Section({ title, description, action, children, className = "" }: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-ink pt-4 ${className}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-xl text-heading">{title}</h2>
        {action}
        {description && <p className="w-full text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, meta, children, actions }: {
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="max-w-[68ch]">
        <h1 className="text-[2.5rem] leading-[1.1] tracking-[-0.015em] text-ink">{title}</h1>
        {meta && <p className="tabular mt-2 text-sm font-semibold text-muted">{meta}</p>}
        {children && <div className="mt-3 text-[17px] leading-relaxed text-body">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const NOTICE_STYLES = {
  info: { box: "border-info/25 bg-info-tint text-info", Icon: Info },
  success: { box: "border-pass/25 bg-pass-tint text-pass", Icon: CheckCircle2 },
  warning: { box: "border-warn/25 bg-warn-tint text-warn", Icon: AlertTriangle },
  error: { box: "border-abt-red/25 bg-abt-red-tint text-abt-red-dark", Icon: XCircle },
};

export function Notice({ tone, title, children }: {
  tone: keyof typeof NOTICE_STYLES;
  title: string;
  children?: ReactNode;
}) {
  const { box, Icon } = NOTICE_STYLES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-control border px-4 py-3 ${box}`}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-bold">{title}</p>
        {children && <div className="mt-0.5 text-sm">{children}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="inline-flex items-center gap-1 text-sm font-bold text-pass">
      <Check aria-hidden className="size-4" strokeWidth={2.5} /> Match
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-sm font-bold text-abt-red-dark">
      <X aria-hidden className="size-4" strokeWidth={2.5} /> Differs
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-control bg-line-soft ${className}`} />;
}

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-[17px] font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45";

export const buttonClass = {
  /* Abt's own CTA: red fill, 5px radius */
  primary: `${base} bg-abt-red text-white hover:bg-abt-red-dark active:bg-abt-red-dark`,
  /* Abt's dark button */
  dark: `${base} bg-ink text-white hover:bg-[#333] active:bg-black`,
  secondary: `${base} border border-ink bg-white text-ink hover:bg-surface active:bg-line-soft`,
  link:
    "inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-abt-red underline-offset-4 hover:underline",
};

export const tableHead = "bg-surface text-left text-[13px] font-bold tracking-[0.02em] text-muted";
