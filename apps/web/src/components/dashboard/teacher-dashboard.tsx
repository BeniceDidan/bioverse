"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Trophy, BookOpen, ClipboardList, Download, UserMinus } from "lucide-react";
import { getMasteryStatus } from "@bioverse/shared";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { TeacherDashboard as TeacherDashboardData } from "@/lib/dashboard-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Quizzes default to a 75 pass mark; the table shows one status per student
 * rather than per quiz, so it uses that same reference point. */
const PASSING_SCORE = 75;

function formatDate(iso: string | null) {
  if (!iso) return "Belum aktif";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function TeacherDashboard() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-teacher"],
    queryFn: () => apiClient.get<{ dashboard: TeacherDashboardData }>("/api/dashboard/teacher"),
  });

  const removeStudent = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/dashboard/teacher/students/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard-teacher"] });
    },
    onError: (err) =>
      setActionError(err instanceof ApiClientError ? err.message : "Gagal menghapus akun siswa."),
  });

  function handleRemoveStudent(id: string, name: string) {
    const ok = window.confirm(
      `Keluarkan ${name} dari kelas? Akunnya dihapus permanen beserta nilai, progres, dan riwayat belajarnya. Tindakan ini tidak bisa dibatalkan.`
    );
    if (ok) removeStudent.mutate(id);
  }

  /**
   * Fetched by hand rather than with a plain <a href>: the endpoint needs the
   * in-memory access token, which a normal link navigation cannot carry.
   */
  async function downloadGrades() {
    setDownloading(true);
    setActionError(null);
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch("/api/dashboard/teacher/export", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1] ?? "rekap-nilai.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Gagal mengunduh rekap nilai. Coba lagi sebentar lagi.");
    } finally {
      setDownloading(false);
    }
  }

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading font-semibold text-foreground">Track Record Siswa</h2>
            <Button variant="outline" size="sm" onClick={downloadGrades} loading={downloading}>
              <Download className="size-4" /> Unduh Rekap Nilai (Excel)
            </Button>
          </div>
          {actionError && <p className="mt-3 text-sm text-destructive">{actionError}</p>}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Nama</th>
                  <th className="pb-2 pr-3 font-medium">Submateri Selesai</th>
                  <th className="pb-2 pr-3 font-medium">Rata-rata Nilai</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Kuis Dikerjakan</th>
                  <th className="pb-2 pr-3 font-medium">Terakhir Aktif</th>
                  <th className="pb-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dash.students.map((s) => {
                  const mastery = getMasteryStatus(s.avgQuizScore, PASSING_SCORE);
                  return (
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
                          <Badge variant={mastery.tone === "success" ? "success" : "muted"}>{s.avgQuizScore}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-xs text-muted-foreground">
                          {s.totalAttempts === 0 ? "Belum mengerjakan" : mastery.teacherLabel}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{s.totalAttempts}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{formatDate(s.lastActive)}</td>
                      <td className="py-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          title={`Keluarkan ${s.name} dan hapus akunnya`}
                          aria-label={`Keluarkan ${s.name} dan hapus akunnya`}
                          onClick={() => handleRemoveStudent(s.id, s.name)}
                          loading={removeStudent.isPending && removeStudent.variables === s.id}
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
