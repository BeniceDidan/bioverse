"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Rocket,
  Pencil,
  RefreshCw,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { MaterialUpload, MaterialUploadDetail, UploadStatus } from "@/lib/materi-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownContent } from "@/components/materi/markdown-content";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<UploadStatus, { label: string; variant: "muted" | "secondary" | "default" | "success" }> = {
  UPLOADED: { label: "Membaca PDF...", variant: "muted" },
  READY_TO_EXPAND: { label: "Siap diproses", variant: "secondary" },
  EXPANDING: { label: "Sedang diproses AI...", variant: "secondary" },
  EXPANDED: { label: "Selesai diproses", variant: "default" },
  FAILED: { label: "Gagal", variant: "muted" },
};

export default function UploadMateriPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user && user.role !== "TEACHER") router.replace("/");
  }, [status, user, router]);

  const uploadsQuery = useQuery({
    queryKey: ["teacher-uploads"],
    queryFn: () => apiClient.get<{ uploads: MaterialUpload[] }>("/api/teacher/materials/uploads"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
    refetchInterval: (query) =>
      query.state.data?.uploads.some((u) => u.status === "UPLOADED" || u.status === "EXPANDING") ? 2000 : false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.postForm("/api/teacher/materials/upload", form);
    },
    onSuccess: () => {
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-uploads"] });
    },
    onError: (err) => setUploadError(err instanceof ApiClientError ? err.message : "Gagal mengunggah file"),
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const expandMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/teacher/materials/uploads/${id}/expand`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-uploads"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal memproses materi"),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/teacher/materials/uploads/${id}/publish`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-uploads"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menerbitkan materi"),
  });

  const replaceMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.postForm(`/api/teacher/materials/uploads/${id}/replace`, form);
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-uploads"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal mengganti dokumen"),
  });

  const deleteUploadMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/teacher/materials/uploads/${id}`),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-uploads"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menghapus materi"),
  });

  const editSectionMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description: string }) =>
      apiClient.patch(`/api/teacher/materials/sections/${id}`, { title, description }),
    onSuccess: () => {
      setActionError(null);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["teacher-uploads"] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "Gagal menyimpan perubahan"),
  });

  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewQuery = useQuery({
    queryKey: ["teacher-upload-preview", previewId],
    queryFn: () => apiClient.get<{ upload: MaterialUploadDetail }>(`/api/teacher/materials/uploads/${previewId}`),
    enabled: !!previewId,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  function startEdit(upload: MaterialUpload) {
    if (!upload.materialSection) return;
    setEditingId(upload.id);
    setEditTitle(upload.materialSection.title);
    setEditDescription("");
    setPreviewId(null);
  }

  function handleDeleteUpload(upload: MaterialUpload) {
    const message = upload.materialSection
      ? `Hapus "${upload.fileName}"? Submateri "${upload.materialSection.title}" yang dihasilkan dari PDF ini — beserta preparat mikroskop dan video yang terkait — juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`
      : `Hapus riwayat upload "${upload.fileName}" dari daftar ini?`;
    const ok = window.confirm(message);
    if (ok) deleteUploadMutation.mutate(upload.id);
  }

  function triggerReplace(uploadId: string) {
    setReplaceTargetId(uploadId);
    replaceInputRef.current?.click();
  }

  function handleReplaceFile(files: FileList | null) {
    const file = files?.[0];
    if (!file || !replaceTargetId) return;
    if (file.type !== "application/pdf") {
      setActionError("Hanya file PDF yang bisa diunggah.");
      return;
    }
    replaceMutation.mutate({ id: replaceTargetId, file });
    setReplaceTargetId(null);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Hanya file PDF yang bisa diunggah.");
      return;
    }
    uploadMutation.mutate(file);
  }

  if (status === "idle" || status === "loading" || (status === "authenticated" && user?.role !== "TEACHER")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  const uploads = uploadsQuery.data?.uploads ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="size-7" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">Tambah Materi Baru</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Unggah PDF materi, lalu biarkan AI mengubahnya menjadi halaman belajar interaktif.
        </p>
      </div>

      {/* 3 simple steps */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground sm:text-sm">
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span>
          Unggah PDF
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">2</span>
          Proses dengan AI
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">3</span>
          Terbitkan
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "mt-8 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleReplaceFile(e.target.files)}
        />
        {uploadMutation.isPending ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : (
          <UploadCloud className="size-8 text-primary" />
        )}
        <p className="font-medium text-foreground">
          {uploadMutation.isPending ? "Mengunggah..." : "Tarik & lepas PDF di sini"}
        </p>
        <p className="text-sm text-muted-foreground">atau klik untuk memilih file (maks. 20MB)</p>
      </div>

      {uploadError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      {actionError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Upload list */}
      <div className="mt-10 space-y-3">
        {uploads.map((upload) => (
          <Card key={upload.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <FileText className="size-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{upload.fileName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={STATUS_LABEL[upload.status].variant}>
                    {upload.status === "EXPANDING" && <Loader2 className="size-3 animate-spin" />}
                    {STATUS_LABEL[upload.status].label}
                  </Badge>
                  {upload.materialSection?.isPublished && (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3" /> Sudah terbit
                    </Badge>
                  )}
                </div>
                {upload.errorMessage && (
                  <p className="mt-1 text-xs text-destructive">{upload.errorMessage}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {(upload.status === "READY_TO_EXPAND" || upload.status === "FAILED") && (
                  <Button
                    size="sm"
                    onClick={() => expandMutation.mutate(upload.id)}
                    loading={expandMutation.isPending && expandMutation.variables === upload.id}
                  >
                    <Sparkles className="size-4" />
                    {upload.status === "FAILED" ? "Coba Lagi" : "Proses dengan AI"}
                  </Button>
                )}
                {upload.status === "EXPANDED" && upload.materialSection && !upload.materialSection.isPublished && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewId(previewId === upload.id ? null : upload.id)}
                    >
                      {previewId === upload.id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      {previewId === upload.id ? "Tutup" : "Lihat"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => publishMutation.mutate(upload.id)}
                      loading={publishMutation.isPending && publishMutation.variables === upload.id}
                    >
                      <Rocket className="size-4" /> Terbitkan
                    </Button>
                  </>
                )}
                {upload.materialSection?.isPublished && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/materi/${upload.materialSection.slug}`}>
                      <Eye className="size-4" /> Buka
                    </Link>
                  </Button>
                )}

                <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
                  {upload.materialSection && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Edit judul & deskripsi"
                      aria-label="Edit judul & deskripsi"
                      onClick={() => startEdit(upload)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Ganti dokumen PDF"
                    aria-label="Ganti dokumen PDF"
                    onClick={() => triggerReplace(upload.id)}
                    loading={replaceMutation.isPending && replaceMutation.variables?.id === upload.id}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    title={upload.materialSection ? "Hapus materi & riwayat upload" : "Hapus riwayat upload ini"}
                    aria-label={upload.materialSection ? "Hapus materi & riwayat upload" : "Hapus riwayat upload ini"}
                    onClick={() => handleDeleteUpload(upload)}
                    loading={deleteUploadMutation.isPending && deleteUploadMutation.variables === upload.id}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>

            {editingId === upload.id && upload.materialSection && (
              <CardContent className="space-y-3 border-t border-border pt-5">
                <div>
                  <Label htmlFor={`title-${upload.id}`}>Judul Submateri</Label>
                  <Input id={`title-${upload.id}`} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor={`desc-${upload.id}`}>Deskripsi Singkat</Label>
                  <textarea
                    id={`desc-${upload.id}`}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={upload.materialSection.title ? "Kosongkan jika tidak ingin mengubah deskripsi" : ""}
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      editSectionMutation.mutate({
                        id: upload.materialSection!.id,
                        title: editTitle,
                        description: editDescription,
                      })
                    }
                    loading={editSectionMutation.isPending}
                  >
                    <Check className="size-4" /> Simpan
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                    <X className="size-4" /> Batal
                  </Button>
                </div>
              </CardContent>
            )}

            {previewId === upload.id && (
              <CardContent className="border-t border-border pt-5">
                {previewQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Memuat pratinjau...</p>
                ) : previewQuery.data?.upload.materialSection ? (
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">
                      {previewQuery.data.upload.materialSection.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {previewQuery.data.upload.materialSection.description}
                    </p>
                    <div className="mt-4">
                      <MarkdownContent content={previewQuery.data.upload.materialSection.contentBody} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pratinjau tidak tersedia.</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {uploads.length === 0 && !uploadsQuery.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada materi yang diunggah. Mulai dengan mengunggah PDF di atas.
          </p>
        )}
      </div>
    </div>
  );
}
