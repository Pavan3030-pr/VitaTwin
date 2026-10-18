import Link from "next/link";
import { Compass } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="border-b border-border px-5 py-4 sm:px-8">
        <BrandMark />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">
          We could not find that page
        </h1>
        <p className="mt-1 max-w-md text-sm text-text-secondary">
          The link may be out of date. Head back to the landing page or open the
          demo twin directly.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-border bg-bg-card px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-subtle"
          >
            Go home
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Open demo twin
          </Link>
        </div>
      </main>
    </div>
  );
}
