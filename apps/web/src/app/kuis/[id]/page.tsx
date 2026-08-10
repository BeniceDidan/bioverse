"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Eye,
  Lightbulb,
} from "lucide-react";
import { getMasteryStatus, toScoreOutOf100 } from "@bioverse/shared";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import type { QuizForTaking, QuizAttempt, SubmitAnswerResult, QuizQuestionForTaking } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultipleChoiceQuestion } from "@/components/quiz/take/multiple-choice-question";
import { MatchingQuestion } from "@/components/quiz/take/matching-question";
import { DragDropQuestion } from "@/components/quiz/take/drag-drop-question";
import { EssayQuestion } from "@/components/quiz/take/essay-question";

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  TRUE_FALSE: "Benar/Salah",
  MATCHING: "Mencocokkan",
  IMAGE_IDENTIFICATION: "Identifikasi Gambar",
  DRAG_DROP: "Drag & Drop",
  ESSAY: "Essay",
};

type Phase = "intro" | "taking" | "finished";

export default function TakeQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const quizQuery = useQuery({
    queryKey: ["quiz-take", params.id],
    queryFn: () => apiClient.get<{ quiz: QuizForTaking }>(`/api/quiz/quizzes/${params.id}`),
    enabled: status === "authenticated",
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({});
  const [essays, setEssays] = useState<Record<string, string>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, SubmitAnswerResult>>({});
  const [showReview, setShowReview] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const quiz = quizQuery.data?.quiz;
  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);
  const currentQuestion: QuizQuestionForTaking | undefined = questions[currentIndex];

  // Raw points are meaningless to a student ("120 / 120" tells them nothing),
  // so the result is always expressed out of 100 and paired with what to do next.
  const scoreOutOf100 = toScoreOutOf100(attempt?.score ?? null, attempt?.maxScore ?? null);
  const mastery = getMasteryStatus(scoreOutOf100, quiz?.passingScore ?? 75);

  const startMutation = useMutation({
    mutationFn: () => apiClient.post<{ attempt: QuizAttempt }>(`/api/quiz/quizzes/${params.id}/attempts`),
    onSuccess: (data) => {
      setAttempt(data.attempt);
      setPhase("taking");
      setCurrentIndex(0);
      setFeedbackByQuestion({});
      setSelected({});
      setMappings({});
      setEssays({});
      setShowReview(false);
    },
  });

  const answerMutation = useMutation({
    mutationFn: (payload: { questionId: string; selectedChoiceIds?: unknown; textAnswer?: string }) =>
      apiClient.post<SubmitAnswerResult>(`/api/quiz/attempts/${attempt!.id}/answers`, payload),
    onSuccess: (data) => {
      setFeedbackByQuestion((prev) => ({ ...prev, [data.answer.questionId]: data }));
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: () => apiClient.post<{ attempt: QuizAttempt }>(`/api/quiz/attempts/${attempt!.id}/submit`),
    onSuccess: (data) => {
      setAttempt(data.attempt);
      setPhase("finished");
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts", params.id] });
    },
  });

  // Timer
  useEffect(() => {
    if (phase !== "taking" || !attempt || !quiz?.timeLimitMinutes) return;
    const deadline = new Date(attempt.startedAt).getTime() + quiz.timeLimitMinutes * 60000;
    const tick = () => {
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !finalizeMutation.isPending) finalizeMutation.mutate();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt, quiz?.timeLimitMinutes]);

  function currentFeedback() {
    return currentQuestion ? feedbackByQuestion[currentQuestion.id] ?? null : null;
  }

  function hasAnswerDraft(): boolean {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "ESSAY") return !!essays[currentQuestion.id]?.trim();
    if (currentQuestion.type === "MATCHING" || currentQuestion.type === "DRAG_DROP") {
      return Object.keys(mappings[currentQuestion.id] ?? {}).length > 0;
    }
    return !!selected[currentQuestion.id];
  }

  function submitCurrentAnswer() {
    if (!currentQuestion) return;
    if (currentQuestion.type === "ESSAY") {
      answerMutation.mutate({ questionId: currentQuestion.id, textAnswer: essays[currentQuestion.id] ?? "" });
    } else if (currentQuestion.type === "MATCHING" || currentQuestion.type === "DRAG_DROP") {
      answerMutation.mutate({ questionId: currentQuestion.id, selectedChoiceIds: mappings[currentQuestion.id] ?? {} });
    } else {
      answerMutation.mutate({ questionId: currentQuestion.id, selectedChoiceIds: [selected[currentQuestion.id]] });
    }
  }

  function goNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      finalizeMutation.mutate();
    }
  }

  if (status === "idle" || status === "loading" || quizQuery.isLoading) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }
  if (!quiz) return <div className="py-24 text-center text-sm text-muted-foreground">Kuis tidak ditemukan.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/kuis" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke daftar kuis
      </Link>

      {phase === "intro" && (
        <div className="mt-6 text-center">
          <Badge className="mb-3">{TYPE_LABEL[quiz.type] ?? quiz.type}</Badge>
          <h1 className="font-heading text-3xl font-bold text-foreground">{quiz.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{quiz.description}</p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{questions.length} soal</span>
            {quiz.timeLimitMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-4" /> {quiz.timeLimitMinutes} menit
              </span>
            )}
          </div>
          <Button size="lg" className="mt-8" onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
            Mulai Kuis
          </Button>
        </div>
      )}

      {phase === "taking" && currentQuestion && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Soal {currentIndex + 1} dari {questions.length}
            </p>
            {secondsLeft !== null && (
              <Badge variant={secondsLeft < 60 ? "outline" : "secondary"} className={secondsLeft < 60 ? "border-destructive text-destructive" : ""}>
                <Clock className="size-3.5" /> {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </Badge>
            )}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((currentIndex + (currentFeedback() ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>

          <Card className="mt-5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="outline">{TYPE_LABEL[currentQuestion.type]}</Badge>
                <span className="text-xs text-muted-foreground">{currentQuestion.points} poin</span>
              </div>
              <h2 className="mb-5 font-heading text-lg font-semibold text-foreground">{currentQuestion.prompt}</h2>

              {(currentQuestion.type === "MULTIPLE_CHOICE" ||
                currentQuestion.type === "TRUE_FALSE" ||
                currentQuestion.type === "IMAGE_IDENTIFICATION") && (
                <MultipleChoiceQuestion
                  question={currentQuestion}
                  selectedId={selected[currentQuestion.id] ?? null}
                  onSelect={(id) => setSelected((prev) => ({ ...prev, [currentQuestion.id]: id }))}
                  feedback={currentFeedback()}
                  disabled={!!currentFeedback()}
                />
              )}

              {currentQuestion.type === "MATCHING" && (
                <MatchingQuestion
                  question={currentQuestion}
                  mapping={mappings[currentQuestion.id] ?? {}}
                  onChange={(m) => setMappings((prev) => ({ ...prev, [currentQuestion.id]: m }))}
                  feedback={currentFeedback()}
                  disabled={!!currentFeedback()}
                />
              )}

              {currentQuestion.type === "DRAG_DROP" && (
                <DragDropQuestion
                  question={currentQuestion}
                  mapping={mappings[currentQuestion.id] ?? {}}
                  onChange={(m) => setMappings((prev) => ({ ...prev, [currentQuestion.id]: m }))}
                  feedback={currentFeedback()}
                  disabled={!!currentFeedback()}
                />
              )}

              {currentQuestion.type === "ESSAY" && (
                <EssayQuestion
                  value={essays[currentQuestion.id] ?? ""}
                  onChange={(v) => setEssays((prev) => ({ ...prev, [currentQuestion.id]: v }))}
                  feedback={currentFeedback()}
                  disabled={!!currentFeedback()}
                />
              )}

              {currentFeedback() && currentQuestion.type !== "ESSAY" && (
                <div
                  className={`mt-5 flex gap-2 rounded-xl border p-3 text-sm ${
                    currentFeedback()!.answer.isCorrect
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {currentFeedback()!.answer.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {currentFeedback()!.answer.isCorrect ? "Benar!" : `Kurang tepat (+${currentFeedback()!.answer.pointsAwarded} poin)`}
                    </p>
                    <p className="mt-0.5 text-foreground/80">{currentFeedback()!.explanation}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                {currentFeedback() ? (
                  <Button onClick={goNext} loading={finalizeMutation.isPending}>
                    {currentIndex + 1 < questions.length ? "Lanjut" : "Selesai"}
                  </Button>
                ) : (
                  <Button onClick={submitCurrentAnswer} disabled={!hasAnswerDraft()} loading={answerMutation.isPending}>
                    Jawab
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {phase === "finished" && attempt && (
        <div className="mt-6">
          <div className="text-center">
            <span
              className={cn(
                "mx-auto flex size-16 items-center justify-center rounded-2xl",
                mastery.tone === "success" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <Trophy className="size-8" />
            </span>
            <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">{mastery.studentHeadline}</h1>
            <p className="mt-2 text-4xl font-bold text-primary">{scoreOutOf100 ?? 0} / 100</p>
            <p className="mt-1 text-sm text-muted-foreground">Nilai kelulusan: {quiz.passingScore}</p>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{mastery.studentMessage}</p>

            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setShowReview((v) => !v)}>
                <Eye className="size-4" /> {showReview ? "Sembunyikan" : "Lihat"} Jawaban
              </Button>
              <Button onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
                <RotateCcw className="size-4" /> Coba Lagi
              </Button>
            </div>
          </div>

          {showReview && (
            <div className="mt-8 space-y-4">
              {questions.map((q, i) => {
                const fb = feedbackByQuestion[q.id];
                return (
                  <Card key={q.id}>
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline">
                          {i + 1}. {TYPE_LABEL[q.type]}
                        </Badge>
                        {fb && q.type !== "ESSAY" && (
                          <Badge variant={fb.answer.isCorrect ? "success" : "muted"}>
                            {fb.answer.isCorrect ? "Benar" : `+${fb.answer.pointsAwarded} poin`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                      {fb && (
                        <div className="mt-2 flex gap-1.5 text-xs text-muted-foreground">
                          <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                          <span>{fb.explanation}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
