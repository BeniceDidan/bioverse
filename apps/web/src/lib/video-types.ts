export interface VideoSummary {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  durationSeconds: number | null;
  isPublished: boolean;
  order: number;
  createdAt: string;
  materialSection: { id: string; title: string; slug?: string };
}
