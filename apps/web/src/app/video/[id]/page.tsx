"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { VideoSummary } from "@/lib/video-types";
import { Badge } from "@/components/ui/badge";

export default function VideoWatchPage() {
  const params = useParams<{ id: string }>();

  const videoQuery = useQuery({
    queryKey: ["video", params.id],
    queryFn: () => apiClient.get<{ video: VideoSummary }>(`/api/video/videos/${params.id}`),
  });

  const video = videoQuery.data?.video;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/video" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke daftar video
      </Link>

      {videoQuery.isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat video...</p>}

      {video && (
        <div className="mt-5">
          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}`}
              title={video.title}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="mt-5">
            <Badge variant="outline" className="mb-2">
              {video.materialSection.title}
            </Badge>
            <h1 className="font-heading text-2xl font-bold text-foreground">{video.title}</h1>
            <p className="mt-2 text-muted-foreground">{video.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
