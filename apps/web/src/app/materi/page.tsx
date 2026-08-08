import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, Sparkles, Layers, Waves, Download } from "lucide-react";
import { apiServerGet } from "@/lib/api-server";
import type { MaterialWithSections } from "@/lib/materi-types";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Materi Jaringan Hewan" };

const CARD_ACCENTS = [
  { bg: "from-primary/20 to-primary/5", icon: Layers, iconColor: "text-primary" },
  { bg: "from-secondary/20 to-secondary/5", icon: Waves, iconColor: "text-secondary" },
  { bg: "from-accent/30 to-accent/5", icon: Sparkles, iconColor: "text-accent-foreground" },
];

export default async function MateriListPage() {
  const data = await apiServerGet<{ material: MaterialWithSections | null }>("/api/materials");
  const material = data?.material;
  const sections = material?.sections ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3">
          <BookOpen className="size-3.5" /> Materi Biologi
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{material?.title ?? "Jaringan Hewan"}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          {material?.description ??
            "Materi biologi tentang empat jaringan dasar penyusun tubuh hewan vertebrata."}
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {sections.map((s, i) => {
          const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
          return (
            <Card key={s.id} className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
              <Link href={`/materi/${s.slug}`}>
                <div className={`relative flex h-20 items-center justify-between bg-gradient-to-br ${accent.bg} px-6`}>
                  <accent.icon className={`size-10 ${accent.iconColor} opacity-70`} />
                  <span className="flex size-9 items-center justify-center rounded-lg bg-card text-sm font-bold text-primary shadow-sm">
                    {i + 1}
                  </span>
                </div>
              </Link>
              <CardContent className="flex h-full flex-col p-6 pt-5">
                <Link href={`/materi/${s.slug}`} className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {s.estimatedMinutes} menit
                    </span>
                  </div>
                  <h2 className="mt-2 font-heading text-lg font-semibold text-foreground">{s.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/materi/${s.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary"
                  >
                    Pelajari <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  {s.upload?.fileUrl && (
                    <a
                      href={resolveFileUrl(s.upload.fileUrl)}
                      download={s.upload.fileName}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Download className="size-3.5" /> Unduh Sumber
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sections.length === 0 && (
          <div className="col-span-2 flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </span>
            <p className="font-medium text-foreground">Belum ada materi</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Materi akan muncul di sini setelah guru menambahkannya. Coba lagi nanti, ya!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
