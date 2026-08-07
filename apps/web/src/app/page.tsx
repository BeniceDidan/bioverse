import { apiServerGet } from "@/lib/api-server";
import type { MaterialWithSections } from "@/lib/materi-types";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { MateriPreview } from "@/components/home/materi-preview";
import { Testimonials } from "@/components/home/testimonials";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCta } from "@/components/home/final-cta";

export default async function HomePage() {
  const data = await apiServerGet<{ material: MaterialWithSections | null }>("/api/materials");
  const sections = data?.material?.sections ?? [];

  return (
    <>
      <Hero materiCount={sections.length} />
      <HowItWorks />
      {sections.length > 0 && <MateriPreview sections={sections} />}
      <Testimonials />
      <FaqSection />
      <FinalCta />
    </>
  );
}
