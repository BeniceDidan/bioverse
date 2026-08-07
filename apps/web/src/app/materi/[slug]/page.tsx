import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Clock,
  Target,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Microscope,
  Video as VideoIcon,
  ListTodo,
} from "lucide-react";
import { apiServerGet, apiServerGetWithStatus } from "@/lib/api-server";
import type { MaterialSectionDetail, MaterialWithSections } from "@/lib/materi-types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownContent } from "@/components/materi/markdown-content";
import { MateriActions } from "@/components/materi/materi-actions";

async function getData(slug: string) {
  const [sectionResult, materialData] = await Promise.all([
    apiServerGetWithStatus<{ section: MaterialSectionDetail }>(`/api/materials/sections/${slug}`),
    apiServerGet<{ material: MaterialWithSections }>("/api/materials"),
  ]);
  return {
    section: sectionResult.data?.section ?? null,
    sectionStatus: sectionResult.status,
    material: materialData?.material ?? null,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { section } = await getData(slug);
  return { title: section?.title ?? "Materi" };
}

export default async function MateriDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { section, sectionStatus, material } = await getData(slug);

  // Only 404 when the API genuinely has no such section. A cold/slow API
  // (free-tier instance waking up) must not be mistaken for "doesn't exist".
  if (sectionStatus === "not_found") notFound();

  if (!section) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Gagal memuat materi</h1>
        <p className="mt-3 text-muted-foreground">
          Server sedang menyala kembali setelah tidak ada aktivitas. Coba muat ulang halaman ini dalam beberapa
          detik.
        </p>
        <Link href="/materi" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          ← Kembali ke daftar materi
        </Link>
      </div>
    );
  }

  const sections = material?.sections ?? [];
  const currentIndex = sections.findIndex((s) => s.slug === slug);
  const prev = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/materi" className="hover:text-primary">Materi</Link>
        <span>/</span>
        <span className="text-foreground">{section.title}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Submateri {section.order}/{sections.length || section.order}</Badge>
        <Badge variant="outline">
          <Clock className="size-3.5" /> {section.estimatedMinutes} menit
        </Badge>
      </div>

      <h1 className="mt-4 font-heading text-3xl font-bold text-foreground sm:text-4xl">{section.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{section.description}</p>

      <div className="mt-6">
        <MateriActions sectionId={section.id} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="size-4 text-primary" /> Tujuan Pembelajaran
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {section.learningObjectives.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span> {o}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListChecks className="size-4 text-secondary" /> Indikator Pencapaian
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {section.indicators.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-secondary">•</span> {o}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <article className="mt-10">
        <MarkdownContent content={section.contentBody} />
      </article>

      {section.structureFunctionNote && (
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardContent className="flex gap-3 p-5">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Hubungan Struktur & Fungsi</h2>
              <p className="mt-1 text-sm text-muted-foreground">{section.structureFunctionNote}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {section.realLifeExamples.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Contoh Kehidupan Nyata</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {section.realLifeExamples.map((ex, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">✦</span> {ex}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4 bg-muted/50">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Ringkasan</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{section.summary}</p>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: VideoIcon, label: "Video Pembelajaran", href: "/video" },
          { icon: Microscope, label: "Virtual Microscope", href: "/virtual-microscope" },
          { icon: ListTodo, label: "Kuis", href: "/kuis" },
        ].map((r) => (
          <Link key={r.label} href={r.href}>
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/40">
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                <r.icon className="size-6 text-primary" />
                <span className="text-sm font-medium text-foreground">{r.label}</span>
                <span className="text-xs text-muted-foreground">Lihat selengkapnya</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        {prev ? (
          <Link
            href={`/materi/${prev.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="size-4" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/materi/${next.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {next.title} <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
