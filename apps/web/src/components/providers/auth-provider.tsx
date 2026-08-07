"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { tryRefresh } from "@/lib/api-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setStatus = useAuthStore((s) => s.setStatus);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "idle") return;
    setStatus("loading");
    tryRefresh().then((ok) => {
      if (!ok) useAuthStore.getState().clearSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
