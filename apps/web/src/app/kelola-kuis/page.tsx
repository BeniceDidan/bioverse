"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ListChecks, CheckCircle2, AlertCircle, Pencil, HelpCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { MaterialSectionOption } from "@/lib/microscope-types";
import type { QuizSummary } from "@/lib/quiz-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QUESTION_TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Pilihan Ganda" },
  { value: "TRUE_FALSE", label: "Benar/Salah" },
  { value: "MATCHING", label: "Mencocokkan" },
  { value: "DRAG_DROP", label: "Drag & Drop" },
  { value: "ESSAY", label: "Essay" },
];

export default function KelolaKuisPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user && user.role !== "TEACHER") router.replace("/");
  }, [status, user, router]);

  const [materialSectionId, setMaterialSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quizType, setQuizType] = useState<"PRETEST" | "POSTTEST" | "PRACTICE">("PRETEST");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("10");
  const [passingScore, setPassingScore] = useState("70");
  const [types, setTypes] = useState<string[]>(["MULTIPLE_CHOICE", "TRUE_FALSE"]);
  const [count, setCount] = useState("5");
  const [formError, setFormError] = useState<string | null>(null);

  const sectionsQuery = useQuery({
    queryKey: ["teacher-sections"],
    queryFn: () => apiClient.get<{ sections: MaterialSectionOption[] }>("/api/teacher/materials/sections"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const quizzesQuery = useQuery({
    queryKey: ["teacher-quizzes"],
    queryFn: () => apiClient.get<{ quizzes: QuizSummary[] }>("/api/teacher/quiz/quizzes"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ quiz: { id: string } }>("/api/teacher/quiz/generate", {
        materialSectionId,
        title,
        description,
        quizType,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        passingScore: Number(passingScore) || 70,
        types,
        count: Number(count) || 5,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-quizzes"] });
      router.push(`/kelola-kuis/${data.quiz.id}`);
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Gagal membuat kuis"),
  });

  function toggleType(value: string) {
    setTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!materialSectionId) return setFormError("Pilih submateri terlebih dahulu.");
    if (!title.trim() || !description.trim()) return setFormError("Judul dan deskripsi wajib diisi.");
    if (types.length === 0) return setFormError("Pilih minimal 1 tipe soal.");
    generateMutation.mutate();
  }

  if (status === "idle" || status === "loading" || (status === "authenticated" && user?.role !== "TEACHER")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  const sections = sectionsQuery.data?.sections ?? [];
  const quizzes = quizzesQuery.data?.quizzes ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ListChecks className="size-7" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">Kelola Kuis</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Buat kuis otomatis dengan AI dari materi yang sudah ada, lalu tinjau sebelum diterbitkan.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" /> Buat Kuis dengan AI
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="section">Submateri</Label>
              <select
                id="section"
                value={materialSectionId}
                onChange={(e) => setMaterialSectionId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground"
              >
                <option value="">Pilih submateri...</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} {s.isPublished ? "" : "(draft)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="title">Judul Kuis</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pretest Jaringan Ikat" />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Uji pemahaman awal sebelum belajar jaringan ikat"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="quizType">Jenis</Label>
                <select
                  id="quizType"
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value as typeof quizType)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-2 text-sm text-foreground"
                >
                  <option value="PRETEST">Pretest</option>
                  <option value="POSTTEST">Posttest</option>
                  <option value="PRACTICE">Latihan</option>
                </select>
              </div>
              <div>
                <Label htmlFor="time">Waktu (menit)</Label>
                <Input id="time" type="number" min={0} value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="passing">Nilai Lulus</Label>
                <Input id="passing" type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Tipe Soal (AI akan membuat campuran dari tipe yang dipilih)</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {QUESTION_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      types.includes(opt.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <HelpCircle className="size-3.5" /> Soal Identifikasi Gambar perlu ditambahkan manual (butuh gambar).
              </p>
            </div>

            <div>
              <Label htmlFor="count">Jumlah Soal</Label>
              <Input id="count" type="number" min={1} max={15} value={count} onChange={(e) => setCount(e.target.value)} />
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button type="submit" className="w-full" loading={generateMutation.isPending}>
              <Sparkles className="size-4" /> Buat Kuis dengan AI
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-10 space-y-3">
        <h2 className="font-heading font-semibold text-foreground">Kuis Anda</h2>
        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{quiz.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {quiz.materialSection?.title ?? "Materi telah dihapus"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={quiz.isPublished ? "success" : "muted"}>
                    {quiz.isPublished ? <CheckCircle2 className="size-3" /> : null}
                    {quiz.isPublished ? "Terbit" : "Draft"}
                  </Badge>
                  <Badge variant="outline">{quiz._count?.questions ?? 0} soal</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/kelola-kuis/${quiz.id}`}>
                  <Pencil className="size-4" /> Kelola
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {quizzes.length === 0 && !quizzesQuery.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada kuis yang dibuat.</p>
        )}
      </div>
    </div>
  );
}
