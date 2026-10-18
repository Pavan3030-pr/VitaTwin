/** Loading skeleton shown while a twin page resolves on the server. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading twin state…</span>

      <div className="h-40 animate-pulse rounded-2xl border border-border bg-bg-card" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className="h-20 animate-pulse rounded-xl border border-border bg-bg-card"
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="h-48 animate-pulse rounded-xl border border-border bg-bg-card"
          />
        ))}
      </div>
    </div>
  );
}
