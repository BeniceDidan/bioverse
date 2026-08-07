export const ROLES = ["STUDENT", "TEACHER"] as const;
export type Role = (typeof ROLES)[number];

export const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "MATCHING",
  "IMAGE_IDENTIFICATION",
  "DRAG_DROP",
  "ESSAY",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUIZ_TYPES = ["PRETEST", "POSTTEST", "PRACTICE"] as const;
export type QuizType = (typeof QUIZ_TYPES)[number];

export const MEDIA_TYPES = [
  "IMAGE",
  "DIAGRAM",
  "INFOGRAPHIC",
  "ANIMATION",
  "ILLUSTRATION",
] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MICROSCOPE_MODES = ["BELAJAR", "IDENTIFIKASI", "LATIHAN"] as const;
export type MicroscopeMode = (typeof MICROSCOPE_MODES)[number];

export const NOTIFICATION_TYPES = [
  "MATERI_BARU",
  "NILAI",
  "REMINDER",
  "PROGRESS",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const SUBMATERI_SLUGS = [
  "pengantar-jaringan-hewan",
  "jaringan-epitel",
  "jaringan-ikat",
  "jaringan-otot",
  "jaringan-saraf",
  "ringkasan-materi",
] as const;
export type SubmateriSlug = (typeof SUBMATERI_SLUGS)[number];

export const ACCESS_TOKEN_TTL_MIN = 15;
export const REFRESH_TOKEN_TTL_DAYS = 7;
