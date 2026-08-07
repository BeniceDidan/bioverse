"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

const FAQ = [
  {
    q: "Apakah BioVerse gratis digunakan?",
    a: "Ya, BioVerse dikembangkan sebagai media pembelajaran untuk penelitian dan pengembangan Pendidikan Biologi.",
  },
  {
    q: "Materi apa saja yang tersedia saat ini?",
    a: "BioVerse berfokus mendalam pada satu materi: Jaringan Hewan. Guru menambahkan submateri baru dengan mengunggah PDF.",
  },
  {
    q: "Apakah bisa diakses lewat HP?",
    a: "Bisa. BioVerse responsif di desktop, tablet, maupun ponsel — mode potrait maupun lanskap.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground">Pertanyaan Umum</h2>
        </Reveal>

        <div className="mt-8 space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                  aria-expanded={open === i}
                >
                  <span className="text-sm font-medium text-foreground">{item.q}</span>
                  <ChevronDown
                    className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")}
                  />
                </button>
                <div className={cn("grid transition-all", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
