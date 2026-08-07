import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MATERIAL } from "./seed-data/jaringan-hewan";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BioVerse database...");

  // ── Materi (kontainer kosong — submateri dibuat lewat upload PDF guru) ──
  await prisma.material.upsert({
    where: { slug: MATERIAL.slug },
    update: { title: MATERIAL.title, description: MATERIAL.description },
    create: MATERIAL,
  });
  console.log("  Materi Jaringan Hewan (kontainer) siap.");

  // ── Akun demo ─────────────────────────────────────────────────────────
  const demoPasswordHash = await bcrypt.hash("Demo1234!", 12);

  await prisma.user.upsert({
    where: { email: "siswa.demo@bioverse.id" },
    update: {},
    create: {
      name: "Siti Aminah",
      email: "siswa.demo@bioverse.id",
      passwordHash: demoPasswordHash,
      role: "STUDENT",
      studentProfile: { create: { school: "SMA Negeri 1 Bioverse", grade: "XI IPA 2" } },
    },
  });

  await prisma.user.upsert({
    where: { email: "guru.demo@bioverse.id" },
    update: {},
    create: {
      name: "Budi Santoso, S.Pd.",
      email: "guru.demo@bioverse.id",
      passwordHash: demoPasswordHash,
      role: "TEACHER",
      teacherProfile: { create: { school: "SMA Negeri 1 Bioverse", subject: "Biologi" } },
    },
  });
  console.log("  Akun demo siswa & guru siap.");
  console.log("Seeding selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
