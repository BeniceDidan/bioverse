import Link from "next/link";
import { BioVerseLogo } from "@/components/layout/bioverse-logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-border bg-card p-8 shadow-xl">
        <Link href="/" className="mb-6 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
          <BioVerseLogo className="size-9" />
          BioVerse
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-6">{children}</div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  );
}
