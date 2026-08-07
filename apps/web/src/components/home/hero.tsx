"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Compass, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureHighlightCards } from "./feature-highlight-cards";
import { ScrollIndicator } from "./scroll-indicator";

const BUBBLES = [
  { top: "6%", left: "2%", size: 26, color: "bg-primary/40", duration: 7 },
  { top: "2%", right: "8%", size: 34, color: "bg-secondary/35", duration: 8.5, delay: 0.4 },
  { top: "42%", right: "-2%", size: 18, color: "bg-accent/50", duration: 5.5, delay: 0.9 },
  { bottom: "18%", left: "-4%", size: 22, color: "bg-secondary/30", duration: 6.5, delay: 1.2 },
  { bottom: "4%", right: "14%", size: 16, color: "bg-primary/40", duration: 5, delay: 0.6 },
];

export function Hero({ materiCount }: { materiCount: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 top-40 size-96 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      {/* Decorative leaf flourishes */}
      <svg
        className="pointer-events-none absolute -bottom-6 -left-6 size-32 text-primary/25 sm:size-40"
        viewBox="0 0 100 100"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M10 90 C 10 50, 40 15, 90 10 C 85 55, 55 85, 10 90 Z" />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-8 -right-4 size-24 text-primary/20 sm:size-32"
        viewBox="0 0 100 100"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M90 90 C 90 50, 60 15, 10 10 C 15 55, 45 85, 90 90 Z" />
      </svg>

      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary">
              <GraduationCap className="size-3.5" /> Platform Pembelajaran Biologi Interaktif
            </span>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Belajar Jaringan Hewan
              <br />
              Jadi Lebih Mudah,
              <br />
              <span className="text-primary">Menarik, dan Interaktif</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              BioVerse membantumu memahami konsep Jaringan Hewan lewat multiple representations,
              Virtual Microscope, video, kuis, dan AI Tutor — semua dalam satu tempat yang gampang dipakai.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/materi">
                  Mulai Belajar <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/materi">
                  <Compass className="size-4" /> Jelajahi Materi
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="relative mx-auto aspect-square w-full max-w-md"
          >
            {BUBBLES.map((b, i) => (
              <motion.span
                key={i}
                className={`absolute rounded-full blur-[2px] ${b.color}`}
                style={{
                  top: b.top,
                  left: b.left,
                  right: b.right,
                  bottom: b.bottom,
                  width: b.size,
                  height: b.size,
                }}
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: b.duration, delay: b.delay ?? 0, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
            <Image
              src="/images/cell-illustration.webp"
              alt="Ilustrasi sel hewan"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 448px"
              className="object-contain drop-shadow-xl"
            />
          </motion.div>
        </div>

        <FeatureHighlightCards materiCount={materiCount} />

        <div className="flex justify-center pb-12 lg:pb-16">
          <ScrollIndicator />
        </div>
      </div>
    </section>
  );
}
