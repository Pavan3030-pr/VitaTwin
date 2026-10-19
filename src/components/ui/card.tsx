import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Surface language (DESIGN.md → Core Components).
 *  - Card: the main white panel — hairline border, no heavy shadow.
 *  - Well: a quiet tinted inset for secondary content inside a card.
 */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-xl border border-border bg-bg-card p-5", className)}>
      {children}
    </div>
  );
}

export function Well({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-lg bg-bg-subtle px-3 py-2.5", className)}>{children}</div>
  );
}

export function CardHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-base font-semibold text-text-primary">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Section heading used above groups of cards. */
export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-text-primary">{children}</h2>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </div>
  );
}

/** Page title block shared by every twin screen. */
export function PageHeader({
  title,
  description,
  aside,
}: {
  title: ReactNode;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-[2rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      {aside}
    </header>
  );
}
