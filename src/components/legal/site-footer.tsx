import Link from "next/link";

/** Slim footer with the legal links; reused on public pages and inside the app. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${className}`}>
      <Link href="/privacy" className="underline-offset-2 hover:text-primary-strong hover:underline">
        Privacy policy
      </Link>
      <Link href="/terms" className="underline-offset-2 hover:text-primary-strong hover:underline">
        Terms of use
      </Link>
    </nav>
  );
}
