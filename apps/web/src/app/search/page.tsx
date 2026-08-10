"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SearchX, ArrowRight, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { SearchBar } from "@/components/layout/search-bar";

interface SearchHit {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number | null;
  matchedIn: "title" | "description" | "content";
  snippet: string | null;
}

function SearchResults() {
  const query = (useSearchParams().get("q") ?? "").trim();

  const { data, isFetching } = useQuery({
    queryKey: ["materi-search", query],
    queryFn: () =>
      apiClient.get<{ results: SearchHit[] }>(`/api/materials/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });

  const results = data?.results ?? [];
  const loading = isFetching;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold text-foreground">Hasil pencarian untuk &ldquo;{query}&rdquo;</h1>
      <div className="mt-6">
        <SearchBar />
      </div>

      <div className="mt-8 space-y-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Mencari…
          </div>
        )}

        {!loading &&
          results.map((s) => (
            <Link key={s.id} href={`/materi/${s.slug}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <h2 className="font-medium text-foreground">{s.title}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{s.description}</p>
                    {s.snippet && (
                      <p className="mt-2 line-clamp-2 border-l-2 border-border pl-3 text-xs text-muted-foreground">
                        {s.snippet}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}

        {!loading && query && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <SearchX className="size-8" />
            <p className="text-sm">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;. Pencarian mencakup judul, deskripsi, dan isi
              submateri Jaringan Hewan yang sudah terbit.
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
