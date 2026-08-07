import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { MaterialSectionSummary } from "@/lib/materi-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function MateriPreview({ sections }: { sections: MaterialSectionSummary[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-heading text-3xl font-bold text-foreground">Materi Jaringan Hewan</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Materi yang sudah ditambahkan guru, siap kamu pelajari kapan saja.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/materi">
            Lihat Semua <ArrowRight className="size-4" />
          </Link>
        </Button>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.slice(0, 6).map((s, i) => (
          <Reveal key={s.id} delay={i * 0.05}>
            <Link href={`/materi/${s.slug}`}>
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {s.order}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {s.estimatedMinutes} mnt
                    </span>
                  </div>
                  <h3 className="mt-3 font-heading font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{s.description}</p>
                </CardContent>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
