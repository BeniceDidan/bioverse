"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchX, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { MaterialWithSections } from "@/lib/materi-types";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/layout/search-bar";

function SearchResults() {
  const query = (useSearchParams().get("q") ?? "").toLowerCase();
  const [material, setMaterial] = useState<MaterialWithSections | null>(null);

  useEffect(() => {
    apiClient
      .get<{ material: MaterialWithSections | null }>("/api/materials")
      .then((data) => setMaterial(data.material))
      .catch(() => setMaterial(null));
  }, []);

  const results = (material?.sections ?? []).filter(
    (s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">Hasil pencarian untuk &ldquo;{query}&rdquo;</h1>
      <div className="mt-6">
        <SearchBar />
      </div>

      <div className="mt-8 space-y-3">
        {results.map((s) => (
          <Link key={s.id} href={`/materi/${s.slug}`}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="font-medium text-foreground">{s.title}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{s.description}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {query && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <SearchX className="size-8" />
            <p className="text-sm">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;. Pencarian saat ini mencakup submateri Jaringan
              Hewan — pencarian video dan istilah akan menyusul di fase berikutnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">Memuat...</div>}>
      <SearchResults />
    </Suspense>
  );
}
