import type { ApiResponse, AuthUser } from "@bioverse/shared";
import { useAuthStore } from "./auth-store";

export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

// The free-tier API can be asleep (idle 15min+) and take 30-60s+ to wake up.
// A cold instance shows up here as either a thrown network error (connection
// reset while it's still starting) or a 502/503/504 from the proxy in front
// of it — neither means the request actually reached app code, so retrying
// is safe. Backoff is long enough to ride out Render's documented worst-case
// wake time instead of failing an action the user is actively waiting on
// (e.g. "Mulai Kuis") right as the instance was about to come up.
const RETRY_DELAYS_MS = [3000, 6000, 12000, 20000];
const TRANSIENT_STATUS = new Set([502, 503, 504]);

async function rawRequest<T>(path: string, options: RequestOptions = {}, attempt = 0): Promise<T> {
  const { accessToken, csrfToken } = useAuthStore.getState();
  const isMutating = !["GET", "HEAD", "OPTIONS"].includes(options.method ?? "GET");

  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);
  if (!isFormData) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  // Sent from memory rather than read back off the csrf_token cookie — kept
  // that way even now that requests are proxied same-origin (see
  // next.config.ts), so this keeps working regardless of routing changes.
  if (isMutating && csrfToken) headers.set("x-csrf-token", csrfToken);

  async function retryOrThrow(err: ApiClientError): Promise<T> {
    if (attempt >= RETRY_DELAYS_MS.length) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    return rawRequest<T>(path, options, attempt + 1);
  }

  let res: Response;
  try {
    // Requests go to the web app's own origin and are proxied server-side to
    // the API (see the rewrite in next.config.ts). This makes session/CSRF
    // cookies first-party, so they aren't dropped by browsers that block
    // third-party cookies (Safari does this unconditionally, regardless of
    // SameSite — that was silently breaking login persistence and any
    // CSRF-protected action for anyone not on Chrome).
    res = await fetch(path, { ...options, headers, credentials: "include" });
  } catch {
    return retryOrThrow(
      new ApiClientError(0, "Tidak dapat terhubung ke server. Periksa koneksi internet kamu dan coba lagi.")
    );
  }

  if (TRANSIENT_STATUS.has(res.status)) {
    return retryOrThrow(new ApiClientError(res.status, "Server sedang menyala kembali. Silakan coba lagi."));
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok) {
    if (res.status === 401 && !options.skipAuthRetry && !path.startsWith("/api/auth/")) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return rawRequest<T>(path, { ...options, skipAuthRetry: true });
      }
      useAuthStore.getState().clearSession();
    }
    const message = body && !body.success ? body.message : "Terjadi kesalahan";
    const errors = body && !body.success ? body.errors : undefined;
    throw new ApiClientError(res.status, message, errors);
  }

  if (!body || !body.success) {
    throw new ApiClientError(res.status, "Respons server tidak valid");
  }

  return body.data;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const data = await rawRequest<{ user: AuthUser; accessToken: string; csrfToken: string }>(
          "/api/auth/refresh",
          { method: "POST", skipAuthRetry: true }
        );
        useAuthStore.getState().setSession(data.user, data.accessToken, data.csrfToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export const apiClient = {
  get: <T>(path: string) => rawRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    rawRequest<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  postForm: <T>(path: string, formData: FormData) => rawRequest<T>(path, { method: "POST", body: formData }),
  patch: <T>(path: string, data?: unknown) =>
    rawRequest<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => rawRequest<T>(path, { method: "DELETE" }),
};

export { tryRefresh };
