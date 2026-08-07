"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Video as VideoIcon, PlusCircle, CheckCircle2, AlertCircle, Trash2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { MaterialSectionOption } from "@/lib/microscope-types";
import type { VideoSummary } from "@/lib/video-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function KelolaVideoPage() {
  const router = useRouter();
  const { user, status } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated" && user && user.role !== "TEACHER") router.replace("/");
  }, [status, user, router]);

  const [materialSectionId, setMaterialSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sectionsQuery = useQuery({
    queryKey: ["teacher-sections"],
    queryFn: () => apiClient.get<{ sections: MaterialSectionOption[] }>("/api/teacher/materials/sections"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const videosQuery = useQuery({
    queryKey: ["teacher-videos"],
    queryFn: () => apiClient.get<{ videos: VideoSummary[] }>("/api/teacher/video/videos"),
    enabled: status === "authenticated" && user?.role === "TEACHER",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/api/teacher/video/videos", { materialSectionId, title, description, youtubeUrl }),
    onSuccess: () => {
      setFormError(null);
      setTitle("");
      setDescription("");
      setYoutubeUrl("");
      setMaterialSectionId("");
      queryClient.invalidateQueries({ queryKey: ["teacher-videos"] });
    },
    onError: (err) => setFormError(err instanceof ApiClientError ? err.message : "Gagal menambahkan video"),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      apiClient.post(`/api/teacher/video/videos/${id}/${publish ? "publish" : "unpublish"}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-videos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/teacher/video/videos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-videos"] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!materialSectionId) return setFormError("Pilih submateri terkait.");
    if (!title.trim() || !description.trim()) return setFormError("Judul dan deskripsi wajib diisi.");
    if (!youtubeUrl.trim()) return setFormError("Link YouTube wajib diisi.");
    createMutation.mutate();
  }

  if (status === "idle" || status === "loading" || (status === "authenticated" && user?.role !== "TEACHER")) {
    return <div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>;
  }

  const sections = sectionsQuery.data?.sections ?? [];
  const videos = videosQuery.data?.videos ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <VideoIcon className="size-7" />
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">Kelola Video</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Tambahkan video pembelajaran dari YouTube untuk melengkapi submateri.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground">
            <PlusCircle className="size-4 text-primary" /> Tambah Video Baru
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              <Label htmlFor="title">Judul Video</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Mengenal Jaringan Ikat Hewan"
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Penjelasan visual struktur dan fungsi jaringan ikat."
              />
            </div>

            <div>
              <Label htmlFor="youtubeUrl">Link YouTube</Label>
              <Input
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <Button type="submit" className="w-full" loading={createMutation.isPending}>
              <PlusCircle className="size-4" /> Tambah Video
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-10 space-y-3">
        <h2 className="font-heading font-semibold text-foreground">Video Anda</h2>
        {videos.map((video) => (
          <Card key={video.id}>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                alt={video.title}
                className="aspect-video w-28 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{video.title}</p>
                <p className="truncate text-xs text-muted-foreground">{video.materialSection.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={video.isPublished ? "success" : "muted"}>
                    {video.isPublished ? <CheckCircle2 className="size-3" /> : null}
                    {video.isPublished ? "Terbit" : "Draft"}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => publishMutation.mutate({ id: video.id, publish: !video.isPublished })}
                  loading={publishMutation.isPending}
                >
                  {video.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {video.isPublished ? "Batalkan Terbit" : "Terbitkan"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(video.id)}
                  loading={deleteMutation.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {videos.length === 0 && !videosQuery.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada video yang ditambahkan.</p>
        )}
      </div>
    </div>
  );
}
