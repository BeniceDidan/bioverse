"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@bioverse/shared";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiClient, ApiClientError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await apiClient.post("/api/auth/forgot-password", values);
      setSent(true);
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Terjadi kesalahan. Coba lagi.");
    }
  }

  return (
    <AuthShell
      title="Lupa Password"
      description="Masukkan email kamu, kami akan mengirimkan tautan untuk membuat password baru."
      footer={
        <>
          Ingat password kamu?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Kembali masuk
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="size-8 text-success" />
          <p className="text-sm text-foreground">
            Jika email terdaftar, tautan reset password telah dikirim. Silakan periksa email kamu.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="nama@sekolah.id" className="pl-9" {...register("email")} />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Kirim Tautan Reset
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
