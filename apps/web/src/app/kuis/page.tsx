import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, Clock, HelpCircle, Sparkles } from "lucide-react";
import { apiServerGet } from "@/lib/api-server";
import type { QuizSummary } from "@/lib/quiz-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Kuis" };

const TYPE_LABEL: Record<string, string> = { PRETEST: "Pretest", POSTTEST: "Posttest", PRACTICE: "Latihan" };

export default async function KuisListPage() {
  const data = await apiServerGet<{ quizzes: QuizSummary[] }>("/api/quiz/quizzes");
  const quizzes = data?.quizzes ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3">
          <ListChecks className="size-3.5" /> Kuis Interaktif
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Uji Pemahamanmu</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Kerjakan kuis untuk mengetes seberapa paham kamu tentang Jaringan Hewan.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {quizzes.map((quiz) => (
          <Link key={quiz.id} href={`/kuis/${quiz.id}`}>
            <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <Badge>{TYPE_LABEL[quiz.type] ?? quiz.type}</Badge>
                  {quiz.timeLimitMinutes && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {quiz.timeLimitMinutes} menit
                    </span>
                  )}
                </div>
                <h2 className="mt-3 font-heading text-lg font-semibold text-foreground">{quiz.title}</h2>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{quiz.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline">{quiz.materialSection.title}</Badge>
                  <span>{quiz._count?.questions ?? 0} soal</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {quizzes.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </span>
            <p className="font-medium text-foreground">Belum ada kuis</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Kuis akan muncul di sini setelah guru menambahkannya.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <HelpCircle className="mt-0.5 size-4 shrink-0" />
        Setelah menjawab tiap soal, kamu langsung tahu benar atau salah beserta penjelasannya.
      </div>
    </div>
  );
}
