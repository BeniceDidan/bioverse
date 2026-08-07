const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// The API can be cold (free-tier instance asleep) and take 30-60s+ to wake
// up. Server-rendered pages must not hang waiting for that — bail out fast
// and let the caller render with empty data instead of blocking the whole page.
const SERVER_FETCH_TIMEOUT_MS = 5000;

export interface ApiServerResult<T> {
  data: T | null;
  /** "not_found" only means the API genuinely returned 404 — never a timeout. */
  status: "ok" | "not_found" | "error";
}

export async function apiServerGetWithStatus<T>(path: string): Promise<ApiServerResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });
    if (res.status === 404) return { data: null, status: "not_found" };
    if (!res.ok) return { data: null, status: "error" };
    const body = await res.json();
    return body.success ? { data: body.data as T, status: "ok" } : { data: null, status: "error" };
  } catch {
    return { data: null, status: "error" };
  }
}

export async function apiServerGet<T>(path: string): Promise<T | null> {
  const { data } = await apiServerGetWithStatus<T>(path);
  return data;
}
