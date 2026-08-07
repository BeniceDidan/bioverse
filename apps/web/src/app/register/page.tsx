"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput, type AuthUser } from "@bioverse/shared";
import { useState } from "react";
import { AlertCircle, CheckCircle2, GraduationCap, School } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "STUDENT", school: "", grade: "" },
  });

  const role = watch("role");

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const data = await apiClient.post<{ user: AuthUser; accessToken: string }>("/api/auth/register", values);
      setSession(data.user, data.accessToken);
      setSuccess(true);
      setTimeout(() => router.push("/"), 600);
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Terjadi kesalahan. Coba lagi.");
    }
  }

  return (
    <AuthShell
      title="Buat akun BioVerse"
      description="Mulai jelajahi materi Jaringan Hewan secara interaktif."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>Akun berhasil dibuat! Mengalihkan...</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "STUDENT", label: "Siswa", icon: GraduationCap },
              { value: "TEACHER", label: "Guru", icon: School },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("role", opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-colors",
                role === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <opt.icon className="size-5" />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" placeholder="Nama lengkap kamu" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="nama@sekolah.id" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="school">Sekolah</Label>
            <Input id="school" placeholder="SMA Negeri 1" {...register("school")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grade">{role === "TEACHER" ? "Mapel" : "Kelas"}</Label>
            <Input id="grade" placeholder={role === "TEACHER" ? "Biologi" : "XI IPA 1"} {...register("grade")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" placeholder="Minimal 8 karakter" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Buat Akun
        </Button>
      </form>
    </AuthShell>
  );
}
