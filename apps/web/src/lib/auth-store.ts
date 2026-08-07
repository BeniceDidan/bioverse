import { create } from "zustand";
import type { AuthUser } from "@bioverse/shared";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  csrfToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  setSession: (user: AuthUser, accessToken: string, csrfToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthState["status"]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  csrfToken: null,
  status: "idle",
  setSession: (user, accessToken, csrfToken) => set({ user, accessToken, csrfToken, status: "authenticated" }),
  clearSession: () => set({ user: null, accessToken: null, csrfToken: null, status: "unauthenticated" }),
  setStatus: (status) => set({ status }),
}));
