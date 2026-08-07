import type { Metadata } from "next";
import Link from "next/link";
import { Video as VideoIcon, PlayCircle, Sparkles } from "lucide-react";
import { apiServerGet } from "@/lib/api-server";
import type { VideoSummary } from "@/lib/video-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Video Pembelajaran" };

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function VideoListPage() {
  const data = await apiServerGet<{ videos: VideoSummary[] }>("/api/video/videos");
  const videos = data?.videos ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3">
          <VideoIcon className="size-3.5" /> Video Pembelajaran
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Belajar Lewat Video</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Video pembelajaran Jaringan Hewan yang sudah ditambahkan guru.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Link key={video.id} href={`/video/${video.id}`}>
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayCircle className="size-12 text-white drop-shadow" />
                </span>
                {video.durationSeconds && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(video.durationSeconds)}
                  </span>
                )}
              </div>
              <CardContent className="p-5">
                <h2 className="font-heading font-semibold text-foreground">{video.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
                <Badge variant="outline" className="mt-3">
                  {video.materialSection.title}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}

        {videos.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </span>
            <p className="font-medium text-foreground">Belum ada video</p>
            <p className="max-w-sm text-sm text-muted-foreground">Video akan muncul di sini setelah guru menambahkannya.</p>
          </div>
        )}
      </div>
    </div>
  );
}
