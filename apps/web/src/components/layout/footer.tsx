import Link from "next/link";
import { Leaf, Mail } from "lucide-react";

const SOCIALS = ["IG", "YT", "FB"];

const LEARN_LINKS = [
  { href: "/materi", label: "Materi Jaringan Hewan" },
  { href: "/virtual-microscope", label: "Virtual Microscope" },
  { href: "/ai-tutor", label: "AI Tutor" },
  { href: "/kuis", label: "Kuis Interaktif" },
];

const COMPANY_LINKS = [
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/tentang#faq", label: "FAQ" },
  { href: "/privacy", label: "Kebijakan Privasi" },
  { href: "/terms", label: "Syarat & Ketentuan" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Leaf className="size-5" />
              </span>
              BioVerse
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Interactive Biology Learning Platform — belajar Jaringan Hewan dengan representasi
              interaktif, Virtual Microscope, dan AI Tutor.
            </p>
            <div className="mt-4 flex gap-2">
              {SOCIALS.map((s) => (
                <span
                  key={s}
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Belajar</h3>
            <ul className="space-y-2">
              {LEARN_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Perusahaan</h3>
            <ul className="space-y-2">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Kontak</h3>
            <a
              href="mailto:halo@bioverse.id"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Mail className="size-4" /> halo@bioverse.id
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BioVerse. Dibangun untuk penelitian &amp; pengembangan Pendidikan Biologi.
        </div>
      </div>
    </footer>
  );
}
