import Link from "next/link";
import { BookOpen, Microscope, Bot, ListChecks, ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: BookOpen,
    title: "Baca Materi",
    description: "Pilih materi yang mau dipelajari, lengkap dengan gambar dan penjelasan mudah.",
    href: "/materi",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Microscope,
    title: "Lihat Atlas Histologi",
    description: "Amati jaringan seperti pakai mikroskop asli, langsung dari layar.",
    href: "/virtual-microscope",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Bot,
    title: "Tanya AI Tutor",
    description: "Bingung? Tanya saja ke AI Tutor, dijawab dengan bahasa yang gampang dimengerti.",
    href: "/ai-tutor",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: ListChecks,
    title: "Coba Kuis",
    description: "Uji seberapa paham kamu lewat kuis seru dengan skor langsung.",
    href: "/kuis",
    color: "bg-primary/10 text-primary",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal className="text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">Empat Langkah Belajar Seru</h2>
        <p className="mt-2 text-muted-foreground">Semudah ini caranya belajar Jaringan Hewan di BioVerse.</p>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.08}>
            <Link href={step.href} className="group block h-full">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <span
                  className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${step.color}`}
                >
                  <step.icon className="size-7" />
                </span>
                <h3 className="mt-4 font-heading font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{step.description}</p>
                <span className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-primary">
                  Coba sekarang <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
