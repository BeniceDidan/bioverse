import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Reveal } from "./reveal";

const TESTIMONIALS = [
  {
    name: "Rina",
    role: "Siswa Kelas XI IPA",
    quote:
      "Atlas Histologi-nya bikin aku ngerti bedanya otot polos, rangka, dan jantung tanpa harus ke lab.",
  },
  {
    name: "Pak Dedi",
    role: "Guru Biologi SMA",
    quote:
      "Materinya terstruktur rapi sesuai indikator pembelajaran, memudahkan saya menyiapkan bahan ajar.",
  },
  {
    name: "Ayu",
    role: "Mahasiswa Pendidikan Biologi",
    quote:
      "Kombinasi teks, visual, dan AI Tutor sangat membantu saat menyiapkan materi microteaching.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-heading text-3xl font-bold text-foreground">Kata Mereka</h2>
        <p className="mt-3 text-muted-foreground">Gambaran pengalaman pengguna BioVerse dari berbagai peran.</p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08}>
            <Card className="h-full">
              <CardContent className="p-6">
                <p className="text-sm text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{t.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
