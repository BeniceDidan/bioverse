import { BookOpen, Video, ListChecks, Microscope, Bot } from "lucide-react";
import { Reveal } from "./reveal";

export function FeatureHighlightCards({ materiCount }: { materiCount: number }) {
  const cards = [
    {
      icon: BookOpen,
      value: materiCount > 0 ? `${materiCount}+` : "Baru",
      label: "Materi",
      bg: "bg-primary/10 text-primary",
    },
    {
      icon: Video,
      value: "Segera",
      label: "Video",
      bg: "bg-secondary/10 text-secondary",
    },
    {
      icon: ListChecks,
      value: "Segera",
      label: "Kuis Interaktif",
      bg: "bg-accent/20 text-accent-foreground",
    },
    {
      icon: Microscope,
      value: "Interaktif",
      label: "Atlas Histologi",
      bg: "bg-primary/10 text-primary",
    },
    {
      icon: Bot,
      value: "24/7",
      label: "AI Tutor",
      bg: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => (
        <Reveal key={c.label} delay={i * 0.05}>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading text-lg font-bold leading-tight text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
