import type { Metadata } from "next";

export const metadata: Metadata = { title: "Syarat & Ketentuan" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-foreground">Syarat &amp; Ketentuan</h1>
      <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui: 2026</p>

      <div className="prose prose-sm sm:prose-base mt-8 max-w-none text-foreground/90">
        <p>Dengan menggunakan BioVerse, Anda menyetujui ketentuan berikut.</p>
        <h2>Penggunaan Platform</h2>
        <p>
          BioVerse disediakan sebagai media pembelajaran untuk mendukung penelitian dan pengembangan
          Pendidikan Biologi. Konten materi disusun untuk tujuan edukasi dan tidak boleh disalahgunakan
          di luar konteks tersebut.
        </p>
        <h2>Akun Pengguna</h2>
        <p>
          Setiap pengguna bertanggung jawab menjaga kerahasiaan kredensial akunnya. Informasi yang
          didaftarkan harus akurat.
        </p>
        <h2>AI Tutor</h2>
        <p>
          AI Tutor dirancang untuk menjawab pertanyaan seputar materi Jaringan Hewan. Jawaban AI Tutor
          bersifat bantu-ajar dan tetap perlu diverifikasi dengan sumber resmi/guru pengampu.
        </p>
        <h2>Perubahan Ketentuan</h2>
        <p>
          Ketentuan ini dapat diperbarui sewaktu-waktu seiring perkembangan platform. Perubahan akan
          diinformasikan melalui halaman ini.
        </p>
      </div>
    </div>
  );
}
