import { REFRESH_TOKEN_TTL_DAYS } from "@bioverse/shared";
import type { LoginInput, RegisterInput } from "@bioverse/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, verifyPassword } from "../../utils/password";
import { generateRefreshToken, hashToken, signAccessToken } from "../../utils/jwt";
import { env } from "../../config/env";
import crypto from "node:crypto";

// When an allowlist is configured, only those emails may ever become TEACHER —
// everyone else is registered as STUDENT regardless of what the client requests.
// An empty allowlist (e.g. local dev) leaves the requested role unrestricted.
function resolveRegistrationRole(input: RegisterInput): "STUDENT" | "TEACHER" {
  if (env.teacherAllowlist.length === 0) return input.role;
  return env.teacherAllowlist.includes(input.email.toLowerCase()) ? "TEACHER" : "STUDENT";
}

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER";
  avatarUrl: string | null;
}) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("Email sudah terdaftar");

  const passwordHash = await hashPassword(input.password);
  const role = resolveRegistrationRole(input);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role,
      ...(role === "STUDENT"
        ? { studentProfile: { create: { school: input.school, grade: input.grade } } }
        : { teacherProfile: { create: { school: input.school, subject: input.grade } } }),
    },
  });

  return issueSession(user.id, user.role);
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized("Email atau password salah");

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Email atau password salah");

  return issueSession(user.id, user.role, input.rememberMe);
}

export async function issueSession(userId: string, role: "STUDENT" | "TEACHER", rememberMe = true) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const accessToken = signAccessToken({ sub: user.id, role });
  const { token: refreshToken, hash } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: rememberMe ? refreshExpiry() : new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const csrfToken = crypto.randomBytes(32).toString("hex");

  return { user: toAuthUser(user), accessToken, refreshToken, csrfToken };
}

export async function rotateRefreshToken(rawToken: string) {
  const hash = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Sesi telah berakhir, silakan masuk kembali");
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
  return issueSession(user.id, user.role);
}

export async function revokeRefreshToken(rawToken: string) {
  const hash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("Pengguna tidak ditemukan");
  return toAuthUser(user);
}

const RESET_TOKEN_TTL_MIN = 30;

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always behave the same whether or not the email exists, to avoid user enumeration.
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(token);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60 * 1000),
    },
  });

  // No email provider is configured yet — log the reset link server-side so the
  // flow is fully testable locally. Wire up a real mail provider before production.
  // eslint-disable-next-line no-console
  console.log(`[password-reset] Tautan reset untuk ${email}: /reset-password?token=${token}`);
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const hash = hashToken(rawToken);
  const stored = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash } });

  if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
    throw ApiError.badRequest("Tautan reset tidak valid atau telah kedaluwarsa");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
