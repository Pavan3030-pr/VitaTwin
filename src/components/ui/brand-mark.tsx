import Link from "next/link";

/** Logo glyph: two soft overlapping circles (the twin) with a gentle ECG line. */
export function LogoGlyph({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="25" cy="32" r="17" fill="#0D9488" fillOpacity="0.2" />
      <circle cx="39" cy="32" r="17" fill="#38BDF8" fillOpacity="0.22" />
      <path
        d="M4 33h12l4-9 7 22 7-30 5 17h21"
        stroke="#0F766E"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shared logo lockup (DESIGN.md → Logo Usage). Light backgrounds only. */
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
      className="inline-flex items-center gap-2 rounded-md font-display text-xl font-semibold tracking-tight text-text-primary"
      aria-label="VitaTwin home"
    >
      <LogoGlyph />
      {!compact && <span>VitaTwin</span>}
    </Link>
  );
}
