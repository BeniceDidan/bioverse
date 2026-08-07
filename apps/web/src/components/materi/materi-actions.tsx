"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Printer, Share2, Check, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function MateriActions({ sectionId }: { sectionId: string }) {
  const [copied, setCopied] = useState(false);
  const { status } = useAuthStore();

  const markProgress = useMutation({
    mutationFn: (progressStatus: "IN_PROGRESS" | "COMPLETED") =>
      apiClient.post(`/api/materials/sections/${sectionId}/progress`, { status: progressStatus }),
  });

  useEffect(() => {
    if (status === "authenticated") markProgress.mutate("IN_PROGRESS");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sectionId]);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  const isDone = markProgress.isSuccess && markProgress.variables === "COMPLETED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleShare}>
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {copied ? "Tersalin!" : "Bagikan"}
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="size-4" /> Cetak / PDF
      </Button>
      {status === "authenticated" && (
        <Button
          variant={isDone ? "secondary" : "outline"}
          size="sm"
          onClick={() => markProgress.mutate("COMPLETED")}
          loading={markProgress.isPending && markProgress.variables === "COMPLETED"}
        >
          <CheckCircle2 className="size-4" /> {isDone ? "Sudah Dipelajari" : "Tandai Selesai"}
        </Button>
      )}
    </div>
  );
}
