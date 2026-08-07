"use client";

import { Lightbulb } from "lucide-react";
import type { SubmitAnswerResult } from "@/lib/quiz-types";

export function EssayQuestion({
  value,
  onChange,
  feedback,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  feedback: SubmitAnswerResult | null;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        placeholder="Tulis jawabanmu di sini..."
        className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
      />
      {feedback && (
        <div className="flex gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">Jawaban model / rubrik</p>
            <p className="mt-0.5 text-muted-foreground">{feedback.explanation}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Soal essay dinilai mandiri — bandingkan jawabanmu dengan rubrik di atas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
