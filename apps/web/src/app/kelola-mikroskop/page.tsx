"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  Microscope,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Pencil,
  Settings2,
  Eye,
  EyeOff,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import type { MaterialSectionOption, MicroscopeSlideSummary } from "@/lib/microscope-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog, type ConfirmState } from "@/components/ui/confirm-dialog";

export default function KelolaMikroskopPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user && user.role !== "TEACHER") router.replace("/");
  }, [status, user, router]);

  const [file, setFile] = useState<File | null>(null);
  const [tissueName, setTissueName] = useState("");
  const [description, setDescription] = useState("");
  const [tissueType, setTissueType] = useState("");
  const [materialSectionId, setMaterialSectionId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const sectionsQuery = useQuery({
    queryKey: ["teacher-sections"],
    queryFn: () => apiClient.get<{ sections: MaterialSectionOption[] }>("/api/teacher/materials/sections"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const slidesQuery = useQuery({
    queryKey: ["teacher-microscope-slides"],
    queryFn: () => apiClient.get<{ slides: MicroscopeSlideSummary[] }>("/api/teacher/microscope/slides"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("file", file!);
      form.append("materialSectionId", materialSectionId);
      form.append("tissueName", tissueName);
      form.append("description", description);
      // Dikosongkan berarti "tebak dari nama jaringan" di sisi server.
      if (tissueType) form.append("tissueType", tissueType);
      return apiClient.postForm("/api/teacher/microscope/slides", form);
    },
    onSuccess: () => {
      setFormError(null);
      setFile(null);
      setTissueName("");
      setDescription("");
      setTissueType("");
      setMaterialSectionId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slides"] });
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Gagal mengunggah preparat"),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      apiClient.post(`/api/teacher/microscope/slides/${id}/${publish ? "publish" : "unpublish"}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slides"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal mengubah status terbit"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/teacher/microscope/slides/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slides"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menghapus preparat"),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => apiClient.delete<{ message: string }>("/api/teacher/microscope/slides/all"),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slides"] });
    },
    onError: (err) =>
      setActionError(err instanceof ApiClientError ? err.message : "Gagal menghapus semua preparat"),
  });

  const editMutation = useMutation({
    mutationFn: ({
      id,
      tissueName: name,
      description: desc,
      materialSectionId: sectionId,
    }: {
      id: string;
      tissueName: string;
      description: string;
      materialSectionId: string;
    }) => apiClient.patch(`/api/teacher/microscope/slides/${id}`, { tissueName: name, description: desc, materialSectionId: sectionId }),
    onSuccess: () => {
      setActionError(null);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-microscope-slides"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menyimpan perubahan"),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTissueName, setEditTissueName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSectionId, setEditSectionId] = useState("");

  function startEdit(slide: MicroscopeSlideSummary) {
    setEditingId(slide.id);
    setEditTissueName(slide.tissueName);
    setEditDescription(slide.description);
    setEditSectionId(slide.materialSection.id);
  }

  function handleDelete(slide: MicroscopeSlideSummary) {
    setConfirmState({
      title: "Hapus preparat ini?",
      description: `"${slide.tissueName}" beserta semua label di atasnya akan terhapus. Tindakan ini tidak bisa dibatalkan.`,
      onConfirm: () => {
        setConfirmState(null);
        deleteMutation.mutate(slide.id);
      },
    });
  }

  function handleDeleteAll() {
    setConfirmState({
      title: `Hapus semua ${slides.length} preparat?`,
      description: "Seluruh preparat beserta labelnya akan terhapus. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus Semua",
      onConfirm: () => {
        setConfirmState(null);
        deleteAllMutation.mutate();
      },
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!file) return setFormError("Pilih gambar preparat terlebih dahulu.");
    if (!materialSectionId) return setFormError("Pilih submateri terkait.");
    if (!tissueName.trim() || !description.trim()) return setFormError("Nama jaringan dan deskripsi wajib diisi.");
    uploadMutation.mutate();
  }

  if (status === "idle" || status === "loading" || (status === "authenticated" && user?.role !== "TEACHER")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  const slides = slidesQuery.data?.slides ?? [];
  const sections = sectionsQuery.data?.sections ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Microscope className="size-7" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">Kelola Atlas Histologi</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Unggah foto preparat, lalu tambahkan label pada bagian-bagian jaringan.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="font-heading font-semibold text-foreground">Unggah Preparat Baru</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="slide-file">Gambar Preparat</Label>
              <input
                ref={fileInputRef}
                id="slide-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
              />
            </div>

            <div>
              <Label htmlFor="section">Submateri Terkait</Label>
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
              {sections.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Belum ada submateri. Tambahkan materi lewat halaman Upload Materi terlebih dahulu.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tissueName">Nama Jaringan</Label>
              <Input
                id="tissueName"
                value={tissueName}
                onChange={(e) => setTissueName(e.target.value)}
                placeholder="Contoh: Testis (perbesaran sedang)"
              />
            </div>

            <div>
              <Label htmlFor="tissueType">Jenis Jaringan</Label>
              <select
                id="tissueType"
                value={tissueType}
                onChange={(e) => setTissueType(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">Tebak otomatis dari nama jaringan</option>
                <option value="EPITEL">Jaringan Epitel</option>
                <option value="IKAT">Jaringan Ikat</option>
                <option value="OTOT">Jaringan Otot</option>
                <option value="SARAF">Jaringan Saraf</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Menentukan preparat ini masuk kelompok mana di halaman Atlas Histologi.
              </p>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Testis memiliki banyak tubulus seminiferus yang berkelok-kelok."
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button type="submit" className="w-full" loading={uploadMutation.isPending}>
              <UploadCloud className="size-4" /> Unggah Preparat
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading font-semibold text-foreground">
            Preparat Anda{" "}
            {slides.length > 0 && <span className="text-sm font-normal text-muted-foreground">({slides.length})</span>}
          </h2>
          {slides.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDeleteAll}
              loading={deleteAllMutation.isPending}
            >
              <Trash2 className="size-4" /> Hapus Semua
            </Button>
          )}
        </div>

        {actionError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {slides.map((slide) => (
          <Card key={slide.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveFileUrl(slide.slideImageUrl)}
                alt={slide.tissueName}
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{slide.tissueName}</p>
                <p className="truncate text-xs text-muted-foreground">{slide.materialSection.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={slide.isPublished ? "success" : "muted"}>
                    {slide.isPublished ? <CheckCircle2 className="size-3" /> : null}
                    {slide.isPublished ? "Terbit" : "Draft"}
                  </Badge>
                  <Badge variant="outline">
                    <MapPin className="size-3" /> {slide._count?.hotspots ?? 0} label
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/kelola-mikroskop/${slide.id}`}>
                    <Pencil className="size-4" /> Beri Label
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Edit preparat"
                  aria-label="Edit preparat"
                  onClick={() => startEdit(slide)}
                >
                  <Settings2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title={slide.isPublished ? "Batalkan terbit" : "Terbitkan"}
                  aria-label={slide.isPublished ? "Batalkan terbit" : "Terbitkan"}
                  onClick={() => publishMutation.mutate({ id: slide.id, publish: !slide.isPublished })}
                  loading={publishMutation.isPending && publishMutation.variables?.id === slide.id}
                >
                  {slide.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  title="Hapus preparat"
                  aria-label="Hapus preparat"
                  onClick={() => handleDelete(slide)}
                  loading={deleteMutation.isPending && deleteMutation.variables === slide.id}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>

            {editingId === slide.id && (
              <CardContent className="space-y-3 border-t border-border pt-4">
                <div>
                  <Label htmlFor={`edit-tissue-${slide.id}`}>Nama Jaringan</Label>
                  <Input
                    id={`edit-tissue-${slide.id}`}
                    value={editTissueName}
                    onChange={(e) => setEditTissueName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`edit-section-${slide.id}`}>Submateri Terkait</Label>
                  <select
                    id={`edit-section-${slide.id}`}
                    value={editSectionId}
                    onChange={(e) => setEditSectionId(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} {s.isPublished ? "" : "(draft)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`edit-desc-${slide.id}`}>Deskripsi Singkat</Label>
                  <Input
                    id={`edit-desc-${slide.id}`}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      editMutation.mutate({
                        id: slide.id,
                        tissueName: editTissueName,
                        description: editDescription,
                        materialSectionId: editSectionId,
                      })
                    }
                    loading={editMutation.isPending}
                  >
                    <Check className="size-4" /> Simpan
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                    <X className="size-4" /> Batal
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {slides.length === 0 && !slidesQuery.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada preparat yang diunggah.</p>
        )}
      </div>

      <ConfirmDialog
        state={confirmState}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        loading={deleteMutation.isPending || deleteAllMutation.isPending}
      />
    </div>
  );
}
