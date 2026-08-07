"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "idle" || status === "loading") {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }
  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LayoutDashboard className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Belajar</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "TEACHER" ? "Pantau progres dan nilai seluruh siswa." : "Pantau progres belajar dan nilaimu."}
          </p>
        </div>
      </div>

      {user.role === "TEACHER" ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
}
