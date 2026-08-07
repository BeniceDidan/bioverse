import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-foreground">Kebijakan Privasi</h1>
      <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui: 2026</p>

      <div className="prose prose-sm sm:prose-base mt-8 max-w-none text-foreground/90">
        <p>
          BioVerse menghargai privasi penggunanya. Halaman ini menjelaskan data apa saja yang kami
          kumpulkan dan bagaimana data tersebut digunakan.
        </p>
        <h2>Data yang Dikumpulkan</h2>
        <p>
          Kami menyimpan data akun (nama, email, peran, sekolah/kelas) serta data aktivitas belajar
          (progres, nilai, riwayat percakapan AI Tutor) untuk menyediakan fitur pembelajaran dan
          learning analytics.
        </p>
        <h2>Penggunaan Data</h2>
        <p>
          Data digunakan semata-mata untuk menjalankan fitur platform — seperti melacak progres
          belajar dan menampilkan dashboard — serta untuk keperluan penelitian dan pengembangan
          Pendidikan Biologi secara agregat dan anonim.
        </p>
        <h2>Keamanan</h2>
        <p>
          Password disimpan dalam bentuk terenkripsi (hashed), sesi diautentikasi menggunakan token
          yang aman, dan seluruh komunikasi antara aplikasi dan server dilindungi praktik keamanan
          standar industri.
        </p>
        <h2>Kontak</h2>
        <p>
          Pertanyaan seputar privasi dapat disampaikan ke{" "}
          <a href="mailto:halo@bioverse.id">halo@bioverse.id</a>.
        </p>
      </div>
    </div>
  );
}
