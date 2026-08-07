export function BioVerseLogo({ className = "size-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/images/logo.webp" alt="BioVerse" className={className} />
  );
}
