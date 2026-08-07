# BioVerse

**Interactive Biology Learning Platform** — materi Jaringan Hewan untuk SMA & Pendidikan Biologi.

BioVerse mengintegrasikan multiple representations (teks, gambar, diagram, animasi, video),
Virtual Microscope, AI Tutor, kuis interaktif, dan learning analytics dalam satu platform.

## Struktur Proyek

```
bioverse/
├── apps/
│   ├── web/     Next.js 14 (App Router, TypeScript, Tailwind CSS, shadcn/ui)
│   └── api/     Node.js + Express + TypeScript + Prisma ORM
├── packages/
│   └── shared/  Tipe TypeScript & skema validasi bersama antara web & api
└── docs/        Dokumentasi tambahan
```

## Prasyarat

- Node.js >= 20
- PostgreSQL (lokal atau remote)

## Setup

```bash
npm install

# Konfigurasi environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Sesuaikan DATABASE_URL, JWT secrets, ANTHROPIC_API_KEY (opsional, untuk AI Tutor)

# Migrasi & seed database
npm run db:migrate
npm run db:seed

# Jalankan web + api sekaligus
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000

## Akun Demo (setelah seed)

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Siswa   | siswa.demo@bioverse.id | Demo1234!   |
| Guru    | guru.demo@bioverse.id  | Demo1234!   |

## Status Pengembangan

Dibangun bertahap. Lihat commit history / dokumentasi untuk progres tiap modul:

- [x] Fondasi: auth, layout, home
- [ ] Modul Materi (Jaringan Hewan)
- [ ] Virtual Microscope
- [ ] AI Tutor
- [ ] Video Pembelajaran
- [ ] Kuis Interaktif
- [ ] Dashboard Siswa & Guru
- [ ] Search, notifikasi, aksesibilitas, performa
