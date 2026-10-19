/** Loading skeleton shown while a twin page resolves on the server. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading twin state…</span>

      <div className="h-10 w-64 animate-pulse rounded-lg bg-bg-subtle" />

      <div className="grid gap-4 lg:grid-cols-[5fr_7fr]">
        <div className="h-[420px] animate-pulse rounded-2xl bg-bg-wash" />
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-bg-subtle" />
          <div className="h-56 animate-pulse rounded-xl bg-bg-subtle" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-bg-subtle" />
        ))}
      </div>
    </div>
  );
}
