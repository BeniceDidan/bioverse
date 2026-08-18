import type { Metadata } from "next";
import Link from "next/link";
import { Microscope, MapPin, Sparkles } from "lucide-react";
import { apiServerGet } from "@/lib/api-server";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import type { MicroscopeSlideSummary, TissueType } from "@/lib/microscope-types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Atlas Histologi" };

/** The four basic animal tissues, in the order they are taught. LAINNYA sits
 *  last and only appears when something hasn't been categorised yet. */
const TISSUE_GROUPS: { type: TissueType; title: string; blurb: string }[] = [
  { type: "EPITEL", title: "Jaringan Epitel", blurb: "Melapisi permukaan tubuh, rongga, dan organ." },
  { type: "IKAT", title: "Jaringan Ikat", blurb: "Menyokong, mengikat, dan menghubungkan jaringan lain." },
  { type: "OTOT", title: "Jaringan Otot", blurb: "Alat gerak aktif — polos, rangka, dan jantung." },
  { type: "SARAF", title: "Jaringan Saraf", blurb: "Menghantar dan memproses impuls." },
  { type: "LAINNYA", title: "Lainnya", blurb: "Preparat yang belum dikelompokkan." },
];

export default async function VirtualMicroscopeListPage() {
  const data = await apiServerGet<{ slides: MicroscopeSlideSummary[] }>("/api/microscope/slides");
  const slides = data?.slides ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3">
          <Microscope className="size-3.5" /> Atlas Histologi
        </Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">Preparat Digital</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Amati preparat jaringan hewan dan jelajahi bagian-bagiannya lewat label interaktif.
        </p>
      </div>

      {TISSUE_GROUPS.map((group) => {
        const anggota = slides.filter((s) => s.tissueType === group.type);
        // Kelompok kosong tidak ditampilkan supaya halaman tidak penuh judul hampa.
        if (anggota.length === 0) return null;
        return (
          <section key={group.type} className="mt-12">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
              <h2 className="font-heading text-xl font-bold text-foreground">{group.title}</h2>
              <span className="text-sm text-muted-foreground">{group.blurb}</span>
              <span className="ml-auto text-sm text-muted-foreground">{anggota.length} preparat</span>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {anggota.map((slide) => (
          <Link key={slide.id} href={`/virtual-microscope/${slide.id}`}>
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveFileUrl(slide.slideImageUrl)}
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
            </div>
          </section>
        );
      })}

      <div className="mt-12">
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
