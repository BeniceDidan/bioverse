"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestionForTaking, SubmitAnswerResult } from "@/lib/quiz-types";

const PAIR_COLORS = [
  "border-primary bg-primary/10 text-primary",
  "border-secondary bg-secondary/10 text-secondary",
  "border-accent bg-accent/20 text-accent-foreground",
  "border-rose-400 bg-rose-400/10 text-rose-500",
  "border-violet-400 bg-violet-400/10 text-violet-500",
  "border-cyan-400 bg-cyan-400/10 text-cyan-500",
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort((a, b) => String(a).localeCompare(String(b)) - 0.5);
}

export function MatchingQuestion({
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
  const prompts = question.choices.filter((c) => c.matchGroup === "PROMPT");
  const answers = useMemo(() => shuffle(question.choices.filter((c) => c.matchGroup === "ANSWER")), [question.choices]);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const pairIndexByAnswerId: Record<string, number> = {};
  const pairIndexByPromptId: Record<string, number> = {};
  Object.entries(mapping).forEach(([promptId, answerId], i) => {
    pairIndexByPromptId[promptId] = i;
    pairIndexByAnswerId[answerId] = i;
  });

  function handlePromptClick(promptId: string) {
    if (disabled) return;
    if (mapping[promptId]) {
      const next = { ...mapping };
      delete next[promptId];
      onChange(next);
      return;
    }
    setSelectedPromptId(selectedPromptId === promptId ? null : promptId);
  }

  function handleAnswerClick(answerId: string) {
    if (disabled) return;
    const pairedPromptId = Object.keys(mapping).find((k) => mapping[k] === answerId);
    if (pairedPromptId) {
      const next = { ...mapping };
      delete next[pairedPromptId];
      onChange(next);
      return;
    }
    if (selectedPromptId) {
      onChange({ ...mapping, [selectedPromptId]: answerId });
      setSelectedPromptId(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Istilah</p>
        {prompts.map((p) => {
          const idx = pairIndexByPromptId[p.id];
          const isSelected = selectedPromptId === p.id;
          const isCorrect = feedback?.correctPairs ? feedback.correctPairs[p.id] === mapping[p.id] : undefined;
          return (
            <button
              key={p.id}
              disabled={disabled}
              onClick={() => handlePromptClick(p.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors",
                idx !== undefined ? PAIR_COLORS[idx % PAIR_COLORS.length] : "border-border hover:border-primary/40",
                isSelected && "ring-2 ring-primary"
              )}
            >
              {idx !== undefined && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-current text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
              )}
              <span className="text-foreground">{p.text}</span>
              {feedback && (isCorrect ? <CheckCircle2 className="ml-auto size-4 shrink-0 text-success" /> : <XCircle className="ml-auto size-4 shrink-0 text-destructive" />)}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Pasangan</p>
        {answers.map((a) => {
          const idx = pairIndexByAnswerId[a.id];
          return (
            <button
              key={a.id}
              disabled={disabled}
              onClick={() => handleAnswerClick(a.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors",
                idx !== undefined ? PAIR_COLORS[idx % PAIR_COLORS.length] : "border-border hover:border-primary/40"
              )}
            >
              {idx !== undefined && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-current text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
              )}
              <span className="text-foreground">{a.text}</span>
            </button>
          );
        })}
      </div>

      <p className="sm:col-span-2 text-xs text-muted-foreground">
        Klik satu istilah di kiri, lalu klik pasangannya di kanan. Klik lagi untuk membatalkan.
      </p>
    </div>
  );
}
