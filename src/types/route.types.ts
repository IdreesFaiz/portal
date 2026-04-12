/**
 * Shared context type for dynamic API routes with a single `id` parameter.
 * Next.js App Router passes params as a Promise in server-side route handlers.
 */
export interface RouteContext {
  params: Promise<{ id: string }>;
}
