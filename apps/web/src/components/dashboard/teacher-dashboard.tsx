"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, BookOpen, ClipboardList } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { TeacherDashboard as TeacherDashboardData } from "@/lib/dashboard-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string | null) {
  if (!iso) return "Belum aktif";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function TeacherDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-teacher"],
    queryFn: () => apiClient.get<{ dashboard: TeacherDashboardData }>("/api/dashboard/teacher"),
  });

  if (isLoading) return <p className="py-16 text-center text-sm text-muted-foreground">Memuat dashboard...</p>;

  const dash = data?.dashboard;
  if (!dash) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{dash.totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total siswa</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <BookOpen className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{dash.totalSections}</p>
              <p className="text-xs text-muted-foreground">Submateri terbit</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {dash.classAvgScore ?? "-"}
                {dash.classAvgScore !== null && "%"}
              </p>
              <p className="text-xs text-muted-foreground">Rata-rata nilai kelas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{dash.totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Total kuis dikerjakan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-heading font-semibold text-foreground">Ringkasan per Submateri</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Submateri</th>
                  <th className="pb-2 pr-3 font-medium">Mulai</th>
                  <th className="pb-2 pr-3 font-medium">Selesai</th>
                  <th className="pb-2 font-medium">Rata-rata Nilai</th>
                </tr>
              </thead>
              <tbody>
                {dash.perSection.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-foreground">{s.title}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{s.studentsStarted}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{s.studentsCompleted}</td>
                    <td className="py-2.5 text-muted-foreground">{s.avgQuizScore !== null ? `${s.avgQuizScore}%` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dash.perSection.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada submateri terbit.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-heading font-semibold text-foreground">Track Record Siswa</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Nama</th>
                  <th className="pb-2 pr-3 font-medium">Submateri Selesai</th>
                  <th className="pb-2 pr-3 font-medium">Rata-rata Nilai</th>
                  <th className="pb-2 pr-3 font-medium">Kuis Dikerjakan</th>
                  <th className="pb-2 font-medium">Terakhir Aktif</th>
                </tr>
              </thead>
              <tbody>
                {dash.students.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {s.completedSections}/{s.totalSections}
                    </td>
                    <td className="py-2.5 pr-3">
                      {s.avgQuizScore !== null ? (
                        <Badge variant={s.avgQuizScore >= 70 ? "success" : "muted"}>{s.avgQuizScore}%</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{s.totalAttempts}</td>
                    <td className="py-2.5 text-muted-foreground">{formatDate(s.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dash.students.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Belum ada siswa terdaftar.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
