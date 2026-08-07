import type { Metadata } from "next";
import { Leaf, Target, Users, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tentang Kami" };

const VALUES = [
  {
    icon: Target,
    title: "Berbasis Riset",
    description:
      "Dirancang mengikuti kaidah Research and Development (R&D) Pendidikan Biologi, dengan pendekatan multiple representations untuk memperkuat pemahaman konsep.",
  },
  {
    icon: BookOpen,
    title: "Belajar Interaktif",
    description:
      "Menggabungkan teks, visual, video, virtual microscope, dan AI Tutor dalam satu pengalaman belajar yang koheren.",
  },
  {
    icon: Users,
    title: "Untuk Semua",
    description:
      "Dibangun untuk siswa SMA, mahasiswa pendidikan biologi, guru, dosen, hingga peneliti pendidikan.",
  },
];

const FAQ = [
  {
    q: "Apakah BioVerse gratis digunakan?",
    a: "Ya, BioVerse dikembangkan sebagai media pembelajaran untuk mendukung penelitian dan pengembangan Pendidikan Biologi.",
  },
  {
    q: "Materi apa saja yang tersedia?",
    a: "Saat ini BioVerse berfokus pada satu materi mendalam: Jaringan Hewan. Guru dapat menambahkan submateri baru kapan saja dengan mengunggah PDF.",
  },
  {
    q: "Apakah AI Tutor bisa menjawab topik di luar Jaringan Hewan?",
    a: "AI Tutor dirancang khusus untuk materi Jaringan Hewan. Pertanyaan di luar cakupan tersebut akan dijawab dengan penjelasan bahwa topik itu berada di luar cakupan platform.",
  },
];

export default function TentangPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Leaf className="size-7" />
        </span>
        <h1 className="mt-5 font-heading text-3xl font-bold text-foreground sm:text-4xl">Tentang BioVerse</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          BioVerse adalah platform pembelajaran biologi interaktif yang mengintegrasikan multiple
          representations, Virtual Microscope, AI Tutor, video pembelajaran, evaluasi interaktif, dan
          learning analytics dalam satu sistem — berfokus pada materi Jaringan Hewan.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-3">
        {VALUES.map((v) => (
          <Card key={v.title}>
            <CardContent className="p-6">
              <v.icon className="size-6 text-primary" />
              <h2 className="mt-3 font-heading font-semibold text-foreground">{v.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="faq" className="mt-16">
        <h2 className="text-center font-heading text-2xl font-bold text-foreground">Pertanyaan Umum</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-4">
          {FAQ.map((item) => (
            <Card key={item.q}>
              <CardContent className="p-5">
                <h3 className="font-medium text-foreground">{item.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
