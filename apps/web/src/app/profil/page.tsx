"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Mail, LogOut, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProfilPage() {
  const router = useRouter();
  const { user, status, clearSession } = useAuthStore();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  async function handleLogout() {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      clearSession();
      router.push("/");
    }
  }

  if (status === "idle" || status === "loading") {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat profil...</div>;
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <Avatar className="size-20 text-xl">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{user.name}</h1>
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {user.email}
            </p>
          </div>
          <Badge variant={user.role === "TEACHER" ? "secondary" : "default"}>
            <GraduationCap className="size-3.5" />
            {user.role === "TEACHER" ? "Guru" : "Siswa"}
          </Badge>
        </CardContent>
      </Card>

      <Link href="/dashboard">
        <Card className="mt-6 transition-colors hover:border-primary/50">
          <CardContent className="flex items-center justify-between gap-3 p-6">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="size-4 text-primary" /> Progress & Pencapaian
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lihat ringkasan progres belajar dan nilaimu di Dashboard Belajar.
              </p>
            </div>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <Button variant="outline" className="mt-6 w-full text-destructive hover:text-destructive" onClick={handleLogout}>
        <LogOut className="size-4" /> Keluar dari Akun
      </Button>
    </div>
  );
}
