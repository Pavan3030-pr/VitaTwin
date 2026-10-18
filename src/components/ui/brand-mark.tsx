import Link from "next/link";

/** Shared logo lockup: twin circles + gentle ECG line (DESIGN.md). */
export function BrandMark({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md text-lg font-semibold text-text-primary"
      aria-label="VitaTwin home"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="9" cy="12" r="6" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="15" cy="12" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3 12h3l1.5-3 2 6 2-4 1.5 2h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && <span>VitaTwin</span>}
    </Link>
  );
}
