/**
 * Turns a quiz result into a status both the student and the teacher can read.
 *
 * Quiz points are arbitrary (a 12-question quiz worth 10 points each totals
 * 120), which made result screens read as "120 / 120" — a number that means
 * nothing on its own. Everything here works in percent so a score is always
 * out of 100 and comparable between quizzes.
 *
 * The student-facing wording is deliberately encouraging: a student who has
 * not passed yet is told what to do next, never told they are bad at it.
 */
export type MasteryLevel = "LULUS" | "HAMPIR" | "ULANGI";

/** How far below the passing mark still counts as "nearly there". */
const NEAR_MISS_MARGIN = 15;

export interface MasteryStatus {
  level: MasteryLevel;
  /** Shown to the student on their result screen. */
  studentHeadline: string;
  studentMessage: string;
  /** Compact label for the teacher's table. */
  teacherLabel: string;
  /** Drives colour choice in the UI; no styling decisions live in here. */
  tone: "success" | "warning" | "muted";
}

export function toScoreOutOf100(score: number | null, maxScore: number | null): number | null {
  if (score === null || maxScore === null || maxScore <= 0) return null;
  return Math.round((score / maxScore) * 100);
}

export function getMasteryStatus(scoreOutOf100: number | null, passingScore: number): MasteryStatus {
  if (scoreOutOf100 === null) {
    return {
      level: "ULANGI",
      studentHeadline: "Belum ada nilai",
      studentMessage: "Kerjakan kuisnya dulu ya, hasilnya akan muncul di sini.",
      teacherLabel: "Belum mengerjakan",
      tone: "muted",
    };
  }

  if (scoreOutOf100 >= passingScore) {
    return {
      level: "LULUS",
      studentHeadline: "Selamat, kamu lulus!",
      studentMessage: "Pemahamanmu sudah memenuhi target. Lanjut ke materi berikutnya, ya!",
      teacherLabel: "Lulus",
      tone: "success",
    };
  }

  if (scoreOutOf100 >= passingScore - NEAR_MISS_MARGIN) {
    return {
      level: "HAMPIR",
      studentHeadline: "Sedikit lagi!",
      studentMessage:
        "Nilaimu sudah mendekati target. Baca ulang bagian yang masih terasa sulit, lalu coba lagi — kamu hampir sampai.",
      teacherLabel: "Hampir lulus",
      tone: "warning",
    };
  }

  return {
    level: "ULANGI",
    studentHeadline: "Ayo pelajari lagi",
    studentMessage:
      "Masih ada beberapa konsep yang perlu diperkuat. Pelajari ulang materinya pelan-pelan, lalu kerjakan kuis ini sekali lagi. Kamu pasti bisa!",
    teacherLabel: "Perlu mengulang",
    tone: "muted",
  };
}
