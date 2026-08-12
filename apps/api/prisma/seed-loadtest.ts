/**
 * Creates throwaway student accounts for a load test, straight through Prisma.
 *
 * Deliberately not via POST /api/auth/register: that route is behind the auth
 * rate limiter (20 per 15 minutes per IP), so registering 30 accounts would
 * itself be blocked — which is one of the things the load test exists to
 * measure. Setting up through the database keeps the measurement honest.
 *
 * Run:   npx tsx prisma/seed-loadtest.ts 30
 * Clean: npx tsx prisma/seed-loadtest.ts clean
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PREFIX = "loadtest+";
const DOMAIN = "@bioverse.test";
const PASSWORD = "Demo1234!";

async function main() {
  const arg = process.argv[2] ?? "30";

  if (arg === "clean") {
    const { count } = await prisma.user.deleteMany({
      where: { email: { startsWith: PREFIX } },
    });
    console.log(`${count} akun uji beban dihapus`);
    return;
  }

  const total = Number(arg) || 30;
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  let created = 0;
  for (let i = 1; i <= total; i++) {
    const email = `${PREFIX}${String(i).padStart(2, "0")}${DOMAIN}`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        name: `Siswa Uji ${String(i).padStart(2, "0")}`,
        email,
        passwordHash,
        role: "STUDENT",
        studentProfile: { create: {} },
      },
    });
    created++;
  }
  console.log(`${created} akun dibuat (total diminta ${total}), password ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
