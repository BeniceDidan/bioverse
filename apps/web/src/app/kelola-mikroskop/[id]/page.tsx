"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Rocket, EyeOff, Trash2, Plus, X, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import type { MicroscopeHotspot, MicroscopeSlideDetail } from "@/lib/microscope-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const EMPTY_FORM = {
  label: "",
  tissueName: "",
  tissueFunction: "",
  characteristics: "",
  location: "",
  example: "",
};

export default function AnnotateSlidePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user && user.role !== "TEACHER") router.replace("/");
  }, [status, user, router]);

  const slideQuery = useQuery({
    queryKey: ["teacher-microscope-slide", params.id],
    queryFn: () => apiClient.get<{ slide: MicroscopeSlideDetail }>(`/api/teacher/microscope/slides/${params.id}`),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM & { xPercent: number; yPercent: number }) =>
      apiClient.post(`/api/teacher/microscope/slides/${params.id}/hotspots`, data),
    onSuccess: () => {
      setPendingPos(null);
      setForm(EMPTY_FORM);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slide", params.id] });
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Gagal menyimpan label"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      apiClient.patch(`/api/teacher/microscope/hotspots/${id}`, data),
    onSuccess: () => {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slide", params.id] });
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Gagal menyimpan label"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/teacher/microscope/hotspots/${id}`),
    onSuccess: () => {
      setEditingId(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slide", params.id] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/teacher/microscope/slides/${params.id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slide", params.id] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => apiClient.post(`/api/teacher/microscope/slides/${params.id}/unpublish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slide", params.id] }),
  });

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setPendingPos({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  function startEdit(h: MicroscopeHotspot) {
    setPendingPos(null);
    setFormError(null);
    setEditingId(h.id);
    setForm({
      label: h.label,
      tissueName: h.tissueName,
      tissueFunction: h.tissueFunction,
      characteristics: h.characteristics,
      location: h.location,
      example: h.example,
    });
  }

  function cancelForm() {
    setPendingPos(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function submitForm() {
    if (!form.label.trim() || !form.tissueName.trim() || !form.tissueFunction.trim()) {
      setFormError("Label, nama jaringan, dan fungsi wajib diisi.");
      return;
    }
    if (pendingPos) {
      createMutation.mutate({ ...form, xPercent: pendingPos.x, yPercent: pendingPos.y });
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    }
  }

  if (status === "idle" || status === "loading" || (status === "authenticated" && user?.role !== "TEACHER")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  const slide = slideQuery.data?.slide;
  const isFormOpen = !!pendingPos || !!editingId;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/kelola-mikroskop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali
      </Link>

      {slide && (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{slide.tissueName}</h1>
              <p className="text-sm text-muted-foreground">{slide.materialSection.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={slide.isPublished ? "success" : "muted"}>
                {slide.isPublished ? "Terbit" : "Draft"}
              </Badge>
              {slide.isPublished ? (
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

          <p className="mt-2 text-sm text-muted-foreground">
            Klik pada bagian gambar untuk menambahkan label baru. Klik titik yang sudah ada untuk mengedit.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div
              ref={imageRef}
              onClick={handleImageClick}
              className="relative cursor-crosshair overflow-hidden rounded-2xl border border-border bg-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveFileUrl(slide.slideImageUrl)}
                alt={slide.tissueName}
                className="block w-full select-none"
                draggable={false}
              />

              {slide.hotspots.map((h, i) => (
                <button
                  key={h.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(h);
                  }}
                  style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
                  className={cn(
                    "absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-lg transition-transform hover:scale-110",
                    editingId === h.id ? "bg-accent text-accent-foreground" : "bg-primary"
                  )}
                >
                  {i + 1}
                </button>
              ))}

              {pendingPos && (
                <span
                  style={{ left: `${pendingPos.x}%`, top: `${pendingPos.y}%` }}
                  className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent text-accent-foreground shadow-lg"
                >
                  <Plus className="size-3.5" />
                </span>
              )}
            </div>

            <div>
              {isFormOpen ? (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-heading text-sm font-semibold text-foreground">
                      {pendingPos ? "Label Baru" : "Edit Label"}
                    </h2>
                    <button onClick={cancelForm} aria-label="Tutup" className="text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="label">Label Singkat</Label>
                      <Input
                        id="label"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        placeholder="Contoh: Lumen"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tissueName">Nama Jaringan</Label>
                      <Input
                        id="tissueName"
                        value={form.tissueName}
                        onChange={(e) => setForm({ ...form, tissueName: e.target.value })}
                        placeholder="Contoh: Tubulus Seminiferus"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tissueFunction">Fungsi</Label>
                      <Input
                        id="tissueFunction"
                        value={form.tissueFunction}
                        onChange={(e) => setForm({ ...form, tissueFunction: e.target.value })}
                        placeholder="Tempat produksi sel sperma"
                      />
                    </div>
                    <div>
                      <Label htmlFor="characteristics">Ciri-Ciri</Label>
                      <Input
                        id="characteristics"
                        value={form.characteristics}
                        onChange={(e) => setForm({ ...form, characteristics: e.target.value })}
                        placeholder="Berbentuk tubular berkelok"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Lokasi</Label>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Testis"
                      />
                    </div>
                    <div>
                      <Label htmlFor="example">Contoh</Label>
                      <Input
                        id="example"
                        value={form.example}
                        onChange={(e) => setForm({ ...form, example: e.target.value })}
                        placeholder="Bagian utama penyusun testis"
                      />
                    </div>

                    {formError && (
                      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" onClick={submitForm} loading={isSaving}>
                        Simpan
                      </Button>
                      {editingId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(editingId)}
                          loading={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h2 className="font-heading text-sm font-semibold text-foreground">
                    Daftar Label ({slide.hotspots.length})
                  </h2>
                  {slide.hotspots.map((h, i) => (
                    <button
                      key={h.id}
                      onClick={() => startEdit(h)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-left text-sm hover:border-primary/50"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{h.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{h.tissueName}</p>
                      </div>
                    </button>
                  ))}
                  {slide.hotspots.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Belum ada label. Klik pada gambar untuk menambahkan.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
