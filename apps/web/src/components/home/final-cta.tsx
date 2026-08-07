import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-white/10" />
        <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
          Siap menjelajahi Jaringan Hewan?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
          Daftar gratis dan mulai belajar dengan representasi interaktif, Virtual Microscope, dan AI Tutor.
        </p>
        <Button size="lg" variant="accent" className="mt-8" asChild>
          <Link href="/register">
            Daftar Sekarang <ArrowRight className="size-4" />
          </Link>
        </Button>
      </Reveal>
    </section>
  );
}
