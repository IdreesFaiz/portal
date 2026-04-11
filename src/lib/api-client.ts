export type ApiClientOptions = RequestInit & {
  /** Serialized as JSON; sets Content-Type when present. Overrides `body` if both are set. */
  json?: unknown;
};

function joinUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

function parseBody(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Invalid JSON response");
  }
}

/**
 * Single entry for browser → Next API routes.
 * - Throws on HTTP errors and `{ success: false }`.
 * - If `{ success: true, data }` exists, returns `data` as `T`.
 * - Otherwise returns the full JSON body as `T` (e.g. `{ success, student }` on POST).
 */
export async function apiRequest<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
  const { json, headers, body, ...init } = options;
  const url = joinUrl(endpoint);

  const res = await fetch(url, {
    ...init,
    method: init.method ?? (json !== undefined ? "POST" : "GET"),
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : body,
  });

  const parsed = parseBody(await res.text());

  const obj = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;

  if (!res.ok) {
    const msg =
      obj && typeof obj.message === "string" ? obj.message : res.statusText || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (obj && obj.success === false) {
    const msg = typeof obj.message === "string" ? obj.message : "Request failed";
    throw new Error(msg);
  }

  if (obj && obj.success === true && "data" in obj) {
    return obj.data as T;
  }

  return parsed as T;
}
