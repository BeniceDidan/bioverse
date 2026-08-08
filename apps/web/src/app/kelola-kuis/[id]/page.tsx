"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Rocket, EyeOff, Trash2, Plus, Pencil } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { QuizFull, QuizQuestionFull, QuestionType } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionForm, emptyQuestionForm, type QuestionFormValue } from "@/components/quiz/question-form";

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Pilihan Ganda",
  TRUE_FALSE: "Benar/Salah",
  MATCHING: "Mencocokkan",
  IMAGE_IDENTIFICATION: "Identifikasi Gambar",
  DRAG_DROP: "Drag & Drop",
  ESSAY: "Essay",
};

function questionToFormValue(q: QuizQuestionFull): QuestionFormValue {
  const pairs: { prompt: string; answer: string }[] = [];
  if (q.type === "MATCHING" || q.type === "DRAG_DROP") {
    const prompts = q.choices.filter((c) => c.matchGroup === "PROMPT");
    for (const p of prompts) {
      const ans = q.choices.find((c) => c.matchGroup === "ANSWER" && c.matchKey === p.matchKey);
      pairs.push({ prompt: p.text, answer: ans?.text ?? "" });
    }
  }
  return {
    type: q.type,
    prompt: q.prompt,
    explanation: q.explanation,
    points: q.points,
    imageUrl: q.imageUrl ?? "",
    choices: q.choices.filter((c) => !c.matchGroup).map((c) => ({ text: c.text, isCorrect: c.isCorrect })),
    pairs,
  };
}

export default function EditQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user && user.role !== "TEACHER") router.replace("/");
  }, [status, user, router]);

  const quizQuery = useQuery({
    queryKey: ["teacher-quiz", params.id],
    queryFn: () => apiClient.get<{ quiz: QuizFull }>(`/api/teacher/quiz/quizzes/${params.id}`),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<QuestionFormValue>(emptyQuestionForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<QuestionFormValue>(emptyQuestionForm());
  const [actionError, setActionError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["teacher-quiz", params.id] });

  const createMutation = useMutation({
    mutationFn: (v: QuestionFormValue) => apiClient.post(`/api/teacher/quiz/quizzes/${params.id}/questions`, v),
    onSuccess: () => {
      setShowNewForm(false);
      setNewForm(emptyQuestionForm());
      invalidate();
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menyimpan soal"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, v }: { id: string; v: QuestionFormValue }) => apiClient.patch(`/api/teacher/quiz/questions/${id}`, v),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menyimpan soal"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/teacher/quiz/questions/${id}`),
    onSuccess: invalidate,
  });

  const publishMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/teacher/quiz/quizzes/${params.id}/publish`),
    onSuccess: invalidate,
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menerbitkan"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/teacher/quiz/quizzes/${params.id}/unpublish`),
    onSuccess: invalidate,
  });

  if (status === "idle" || status === "loading" || (status === "authenticated" && user?.role !== "TEACHER")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  const quiz = quizQuery.data?.quiz;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/kelola-kuis" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali
      </Link>

      {quiz && (
        <>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">{quiz.materialSection?.title ?? "Materi telah dihapus"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={quiz.isPublished ? "success" : "muted"}>{quiz.isPublished ? "Terbit" : "Draft"}</Badge>
              {quiz.isPublished ? (
                <Button variant="outline" size="sm" onClick={() => unpublishMutation.mutate()} loading={unpublishMutation.isPending}>
                  <EyeOff className="size-4" /> Batalkan Terbit
                </Button>
              ) : (
                <Button size="sm" onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
                  <Rocket className="size-4" /> Terbitkan
                </Button>
              )}
            </div>
          </div>

          {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}

          <div className="mt-6 space-y-3">
            {quiz.questions.map((q, i) => (
              <div key={q.id}>
                {editingId === q.id ? (
                  <QuestionForm
                    value={editForm}
                    onChange={setEditForm}
                    onSubmit={() => updateMutation.mutate({ id: q.id, v: editForm })}
                    onCancel={() => setEditingId(null)}
                    submitting={updateMutation.isPending}
                    allowTypeChange={false}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant="outline">{TYPE_LABELS[q.type]}</Badge>
                          <span className="text-xs text-muted-foreground">{q.points} poin</span>
                        </div>
                        <p className="text-sm text-foreground">{q.prompt}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(q.id);
                            setEditForm(questionToFormValue(q));
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(q.id)}
                          loading={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}

            {quiz.questions.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Belum ada soal. Tambahkan soal manual, atau kembali dan generate ulang dengan AI.
              </p>
            )}
          </div>

          <div className="mt-4">
            {showNewForm ? (
              <QuestionForm
                value={newForm}
                onChange={setNewForm}
                onSubmit={() => createMutation.mutate(newForm)}
                onCancel={() => setShowNewForm(false)}
                submitting={createMutation.isPending}
              />
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowNewForm(true)}>
                <Plus className="size-4" /> Tambah Soal Manual
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
