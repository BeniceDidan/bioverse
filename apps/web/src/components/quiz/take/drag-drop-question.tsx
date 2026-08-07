"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestionForTaking, SubmitAnswerResult } from "@/lib/quiz-types";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort((a, b) => String(a).localeCompare(String(b)) - 0.5);
}

export function DragDropQuestion({
  question,
  mapping,
  onChange,
  feedback,
  disabled,
}: {
  question: QuizQuestionForTaking;
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
  feedback: SubmitAnswerResult | null;
  disabled: boolean;
}) {
  const targets = question.choices.filter((c) => c.matchGroup === "PROMPT");
  const items = useMemo(() => shuffle(question.choices.filter((c) => c.matchGroup === "ANSWER")), [question.choices]);

  const [tappedItemId, setTappedItemId] = useState<string | null>(null);
  const placedItemIds = new Set(Object.values(mapping));
  const unplacedItems = items.filter((i) => !placedItemIds.has(i.id));

  function place(targetId: string, itemId: string) {
    if (disabled) return;
    const next = { ...mapping };
    for (const key of Object.keys(next)) {
      if (next[key] === itemId) delete next[key];
    }
    next[targetId] = itemId;
    onChange(next);
    setTappedItemId(null);
  }

  function unplace(targetId: string) {
    if (disabled) return;
    const next = { ...mapping };
    delete next[targetId];
    onChange(next);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Item (seret atau ketuk untuk pilih, lalu ketuk kotak tujuan)</p>
        <div className="flex flex-wrap gap-2">
          {unplacedItems.map((item) => (
            <button
              key={item.id}
              draggable={!disabled}
              disabled={disabled}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
              onClick={() => setTappedItemId(tappedItemId === item.id ? null : item.id)}
              className={cn(
                "flex cursor-grab items-center gap-1.5 rounded-lg border-2 border-border bg-card px-3 py-2 text-sm text-foreground active:cursor-grabbing",
                tappedItemId === item.id && "border-primary bg-primary/5"
              )}
            >
              <GripVertical className="size-3.5 text-muted-foreground" />
              {item.text}
            </button>
          ))}
          {unplacedItems.length === 0 && <p className="text-xs text-muted-foreground">Semua item sudah ditempatkan.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Tujuan</p>
        {targets.map((target) => {
          const placedId = mapping[target.id];
          const placed = items.find((i) => i.id === placedId);
          const isCorrect = feedback?.correctPairs ? feedback.correctPairs[target.id] === placedId : undefined;

          return (
            <div
              key={target.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData("text/plain");
                if (itemId) place(target.id, itemId);
              }}
              onClick={() => {
                if (tappedItemId) place(target.id, tappedItemId);
                else if (placed) unplace(target.id);
              }}
              className={cn(
                "flex min-h-[52px] items-center justify-between gap-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm transition-colors",
                placed ? "border-solid border-primary bg-primary/5" : "border-border hover:border-primary/40",
                feedback && isCorrect && "border-solid border-success bg-success/10",
                feedback && isCorrect === false && "border-solid border-destructive bg-destructive/10"
              )}
            >
              <span className="font-medium text-foreground">{target.text}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {placed ? placed.text : "— ketuk untuk taruh di sini —"}
                {feedback && (isCorrect ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
