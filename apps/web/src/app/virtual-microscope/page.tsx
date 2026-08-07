import type { Metadata } from "next";
import Link from "next/link";
import { Microscope, MapPin, Sparkles } from "lucide-react";
import { apiServerGet } from "@/lib/api-server";
import type { MicroscopeSlideSummary } from "@/lib/microscope-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Virtual Microscope" };

export default async function VirtualMicroscopeListPage() {
  const data = await apiServerGet<{ slides: MicroscopeSlideSummary[] }>("/api/microscope/slides");
  const slides = data?.slides ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3">
          <Microscope className="size-3.5" /> Virtual Microscope
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Preparat Digital</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Amati preparat jaringan hewan dan jelajahi bagian-bagiannya lewat label interaktif.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide) => (
          <Link key={slide.id} href={`/virtual-microscope/${slide.id}`}>
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${slide.slideImageUrl}`}
                  alt={slide.tissueName}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <CardContent className="p-5">
                <h2 className="font-heading font-semibold text-foreground">{slide.tissueName}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{slide.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline">{slide.materialSection.title}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> {slide._count?.hotspots ?? 0} label
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {slides.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-7" />
            </span>
            <p className="font-medium text-foreground">Belum ada preparat</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Preparat akan muncul di sini setelah guru menambahkannya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
