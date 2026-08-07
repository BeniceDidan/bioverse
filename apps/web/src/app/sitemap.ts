import type { MetadataRoute } from "next";
import { apiServerGet } from "@/lib/api-server";
import type { MaterialWithSections } from "@/lib/materi-types";
import type { MicroscopeSlideSummary } from "@/lib/microscope-types";
import type { VideoSummary } from "@/lib/video-types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/materi", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/virtual-microscope", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/ai-tutor", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/kuis", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/video", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/tentang", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/login", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/register", priority: 0.4, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [materialData, slidesData, videosData] = await Promise.all([
    apiServerGet<{ material: MaterialWithSections }>("/api/materials"),
    apiServerGet<{ slides: MicroscopeSlideSummary[] }>("/api/microscope/slides"),
    apiServerGet<{ videos: VideoSummary[] }>("/api/video/videos"),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const materiEntries: MetadataRoute.Sitemap = (materialData?.material?.sections ?? []).map((s) => ({
    url: `${SITE_URL}/materi/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const microscopeEntries: MetadataRoute.Sitemap = (slidesData?.slides ?? []).map((s) => ({
    url: `${SITE_URL}/virtual-microscope/${s.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const videoEntries: MetadataRoute.Sitemap = (videosData?.videos ?? []).map((v) => ({
    url: `${SITE_URL}/video/${v.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...materiEntries, ...microscopeEntries, ...videoEntries];
}
