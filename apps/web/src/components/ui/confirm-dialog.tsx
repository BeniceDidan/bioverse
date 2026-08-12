"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * In-app replacement for window.confirm.
 *
 * The native dialog cannot be relied on: browsers let a user suppress further
 * dialogs from a page (Safari on iOS offers exactly that after a couple of
 * them), and once suppressed `confirm()` returns false with nothing shown at
 * all. Every destructive action then silently does nothing — which is exactly
 * how "materi tidak bisa dihapus" was reported. This dialog is ordinary DOM,
 * so it cannot be switched off, and it can carry more than one line of plain
 * text about what is going to disappear.
 */
export interface ConfirmState {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  state,
  onOpenChange,
  loading = false,
}: {
  state: ConfirmState | null;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={state !== null} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-background p-6 shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-heading text-base font-semibold text-foreground">
                {state?.title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1.5 text-sm text-muted-foreground">
                {state?.description}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogPrimitive.Close asChild>
              <Button variant="outline" disabled={loading}>
                Batal
              </Button>
            </DialogPrimitive.Close>
            <Button variant="destructive" onClick={() => state?.onConfirm()} loading={loading}>
              {state?.confirmLabel ?? "Hapus"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
