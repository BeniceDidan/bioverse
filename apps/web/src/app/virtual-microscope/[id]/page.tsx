"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, MapPin, Target, Sparkles, Home, Quote } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import type { MicroscopeSlideDetail } from "@/lib/microscope-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MicroscopeViewerPage() {
  const params = useParams<{ id: string }>();
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const slideQuery = useQuery({
    queryKey: ["microscope-slide", params.id],
    queryFn: () => apiClient.get<{ slide: MicroscopeSlideDetail }>(`/api/microscope/slides/${params.id}`),
  });

  const slide = slideQuery.data?.slide;
  const selected = slide?.hotspots.find((h) => h.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/virtual-microscope" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke daftar preparat
      </Link>

      {slideQuery.isLoading && <p className="mt-8 text-center text-sm text-muted-foreground">Memuat preparat...</p>}

      {slide && (
        <>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="secondary" className="mb-2">
                {slide.materialSection.title}
              </Badge>
              <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{slide.tissueName}</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{slide.description}</p>
            </div>

            <Button
              variant={showAllLabels ? "default" : "outline"}
              onClick={() => setShowAllLabels((v) => !v)}
            >
              {showAllLabels ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showAllLabels ? "Sembunyikan Label" : "Tampilkan Label"}
            </Button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveFileUrl(slide.slideImageUrl)}
                alt={slide.tissueName}
                className="block w-full select-none"
                draggable={false}
              />

              {slide.hotspots.map((h, i) => {
                const isSelected = selectedId === h.id;
                const isRevealed = showAllLabels || isSelected;
                return (
                  <div
                    key={h.id}
                    style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <button
                      onClick={() => setSelectedId(isSelected ? null : h.id)}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-lg transition-transform hover:scale-110",
                        isSelected ? "bg-accent text-accent-foreground" : "bg-primary animate-pulse"
                      )}
                      aria-label={`Lihat label ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                    {isRevealed && (
                      <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-lg">
                        {h.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              {selected ? (
                <Card className="border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-heading text-lg font-bold text-foreground">{selected.tissueName}</h2>
                      <Badge>{selected.label}</Badge>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex gap-2">
                        <Target className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Fungsi</p>
                          <p className="text-muted-foreground">{selected.tissueFunction}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Ciri-Ciri</p>
                          <p className="text-muted-foreground">{selected.characteristics}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Home className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Lokasi</p>
                          <p className="text-muted-foreground">{selected.location}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Quote className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">Contoh</p>
                          <p className="text-muted-foreground">{selected.example}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <MapPin className="mx-auto mb-2 size-6" />
                  Klik salah satu titik pada gambar untuk melihat penjelasannya.
                </div>
              )}

              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Titik Preparat ({slide.hotspots.length})
                  {!showAllLabels && (
                    <span className="ml-1.5 font-normal">— klik untuk menebak & melihat jawabannya</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {slide.hotspots.map((h, i) => {
                    const isRevealed = showAllLabels || selectedId === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setSelectedId(h.id === selectedId ? null : h.id)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          selectedId === h.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {i + 1}. {isRevealed ? h.label : "?"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
