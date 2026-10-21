/**
 * Next.js instrumentation hook. `onRequestError` fires for every unhandled
 * server error (Server Components, Route Handlers, Server Actions).
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routeType: string },
) {
  const { reportError } = await import("@/lib/monitoring");
  const err = error as { message?: string; digest?: string };
  reportError({
    scope: `server:${context.routeType}:${request.method} ${request.path}`,
    digest: err?.digest,
    message: err?.message,
  });
}
