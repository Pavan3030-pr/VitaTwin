import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Friendly placeholder for lists and pages that have nothing to show yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-bg-card px-6 py-12 text-center">
      <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-wash text-primary-strong">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-3 font-display text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
