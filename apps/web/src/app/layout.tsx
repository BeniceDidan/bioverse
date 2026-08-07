import type { Metadata } from "next";
import { Poppins, Inter, Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-roboto",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_DESCRIPTION =
  "Platform pembelajaran biologi interaktif untuk materi Jaringan Hewan — dengan Virtual Microscope, AI Tutor, video, dan kuis interaktif.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BioVerse — Interactive Biology Learning Platform",
    template: "%s | BioVerse",
  },
  description: SITE_DESCRIPTION,
  keywords: ["jaringan hewan", "biologi", "virtual microscope", "belajar biologi", "AI tutor biologi", "kuis biologi"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "BioVerse",
    title: "BioVerse — Interactive Biology Learning Platform",
    description: SITE_DESCRIPTION,
    images: ["/images/cell-illustration.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BioVerse — Interactive Biology Learning Platform",
    description: SITE_DESCRIPTION,
    images: ["/images/cell-illustration.webp"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} ${roboto.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
