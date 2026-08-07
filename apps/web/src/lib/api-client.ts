import type { ApiResponse, AuthUser } from "@bioverse/shared";
import { useAuthStore } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, csrfToken } = useAuthStore.getState();
  const isMutating = !["GET", "HEAD", "OPTIONS"].includes(options.method ?? "GET");

  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers);
  if (!isFormData) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  // The web app and API are on different origins, so the frontend can never
  // read the csrf_token cookie directly (cookies aren't visible cross-origin
  // via document.cookie) — the server hands the value back in the
  // login/register/refresh response body instead, and we hold onto it here.
  if (isMutating && csrfToken) headers.set("x-csrf-token", csrfToken);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

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
