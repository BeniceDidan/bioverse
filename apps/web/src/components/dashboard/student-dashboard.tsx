"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Trophy, ClipboardList, ArrowRight, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { StudentDashboard as StudentDashboardData } from "@/lib/dashboard-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_ICON = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: PlayCircle,
  NOT_STARTED: Circle,
};

const STATUS_LABEL = {
  COMPLETED: "Selesai",
  IN_PROGRESS: "Sedang dipelajari",
  NOT_STARTED: "Belum dimulai",
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function StudentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-student"],
    queryFn: () => apiClient.get<{ dashboard: StudentDashboardData }>("/api/dashboard/student"),
  });

  if (isLoading) return <p className="py-16 text-center text-sm text-muted-foreground">Memuat dashboard...</p>;

  const dash = data?.dashboard;
  if (!dash) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {dash.completedSections}/{dash.totalSections}
              </p>
              <p className="text-xs text-muted-foreground">Submateri selesai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{dash.avgQuizScore ?? "-"}{dash.avgQuizScore !== null && "%"}</p>
              <p className="text-xs text-muted-foreground">Rata-rata nilai kuis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{dash.totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Kuis dikerjakan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {dash.recommendation && (
        <Link href={dash.recommendation.href}>
          <Card className="border-primary/30 bg-primary/5 transition-colors hover:border-primary/50">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-medium text-primary">Rekomendasi</p>
                <p className="mt-0.5 font-medium text-foreground">{dash.recommendation.label}</p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-primary" />
            </CardContent>
          </Card>
        </Link>
      )}

      <Card>
        <CardContent className="p-5">
          <h2 className="font-heading font-semibold text-foreground">Progres Submateri</h2>
          <div className="mt-3 space-y-2">
            {dash.sectionProgress.map((s) => {
              const Icon = STATUS_ICON[s.status];
              return (
                <Link
                  key={s.id}
                  href={`/materi/${s.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:bg-muted"
                >
                  <Icon
                    className={
                      s.status === "COMPLETED"
                        ? "size-4 shrink-0 text-success"
                        : s.status === "IN_PROGRESS"
                          ? "size-4 shrink-0 text-primary"
                          : "size-4 shrink-0 text-muted-foreground"
                    }
                  />
                  <span className="flex-1 font-medium text-foreground">{s.title}</span>
                  <Badge variant={s.status === "COMPLETED" ? "success" : "outline"}>{STATUS_LABEL[s.status]}</Badge>
                </Link>
              );
            })}
            {dash.sectionProgress.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada submateri.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-heading font-semibold text-foreground">Riwayat Kuis Terbaru</h2>
          <div className="mt-3 space-y-2">
            {dash.recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{a.quizTitle}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.submittedAt)}</p>
                </div>
                <Badge variant={a.passed ? "success" : "muted"}>
                  {a.score}/{a.maxScore} ({a.percent}%)
                </Badge>
              </div>
            ))}
            {dash.recentAttempts.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada kuis yang dikerjakan.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
