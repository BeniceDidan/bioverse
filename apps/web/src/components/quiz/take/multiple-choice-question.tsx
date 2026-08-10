"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import type { QuizQuestionForTaking, SubmitAnswerResult } from "@/lib/quiz-types";

export function MultipleChoiceQuestion({
  question,
  selectedId,
  onSelect,
  feedback,
  disabled,
}: {
  question: QuizQuestionForTaking;
  selectedId: string | null;
  onSelect: (id: string) => void;
  feedback: SubmitAnswerResult | null;
  disabled: boolean;
}) {
  return (
    <div className="space-y-6">
      {question.imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-border bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveFileUrl(question.imageUrl)}
            alt="Gambar soal"
            className="block w-full"
          />
        </div>
      )}

      <div className="space-y-2.5">
        {question.choices.map((choice) => {
          const isSelected = selectedId === choice.id;
          const isCorrectChoice = feedback?.correctChoiceIds.includes(choice.id);
          const showResult = !!feedback;

          return (
            <button
              key={choice.id}
              disabled={disabled}
              onClick={() => onSelect(choice.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors",
                !showResult && isSelected && "border-primary bg-primary/5",
                !showResult && !isSelected && "border-border hover:border-primary/40",
                showResult && isCorrectChoice && "border-success bg-success/10",
                showResult && isSelected && !isCorrectChoice && "border-destructive bg-destructive/10",
                showResult && !isSelected && !isCorrectChoice && "border-border opacity-60"
              )}
            >
              <span className="text-foreground">{choice.text}</span>
              {showResult && isCorrectChoice && <CheckCircle2 className="size-4 shrink-0 text-success" />}
              {showResult && isSelected && !isCorrectChoice && <XCircle className="size-4 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
