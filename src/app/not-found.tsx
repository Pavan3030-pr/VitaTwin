import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="px-5 py-4 sm:px-8">
        <BrandMark />
      </header>
      <main id="main-content" className="flex flex-1 flex-col items-center justify-center px-5 pb-24 text-center">
        <p className="num font-display text-7xl font-semibold text-primary/70">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text-primary">
          This page is not part of the twin
        </h1>
        <p className="mt-1.5 max-w-md text-sm text-text-secondary">
          The link may be out of date. Go back to the start or open the demo twin directly.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            Go home
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "primary" })}>
            Open demo twin
          </Link>
        </div>
      </main>
    </div>
  );
}
