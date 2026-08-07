import { prisma } from "../../lib/prisma";

function scorePercent(score: number | null, maxScore: number | null): number | null {
  if (score === null || maxScore === null || maxScore === 0) return null;
  return Math.round((score / maxScore) * 100);
}

export async function getStudentDashboard(userId: string) {
  const [sections, progress, attempts] = await Promise.all([
    prisma.materialSection.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, title: true, order: true },
    }),
    prisma.progress.findMany({ where: { userId } }),
    prisma.quizAttempt.findMany({
      where: { userId, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      include: { quiz: { select: { id: true, title: true, passingScore: true, materialSectionId: true } } },
    }),
  ]);

  const progressBySection = new Map(progress.map((p) => [p.materialSectionId, p]));

  const sectionProgress = sections.map((s) => {
    const p = progressBySection.get(s.id);
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      status: p?.status ?? "NOT_STARTED",
      progressPercent: p?.progressPercent ?? 0,
    };
  });

  const completedCount = sectionProgress.filter((s) => s.status === "COMPLETED").length;

  const scoredAttempts = attempts
    .map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      score: a.score,
      maxScore: a.maxScore,
      percent: scorePercent(a.score, a.maxScore),
      passed: scorePercent(a.score, a.maxScore) !== null ? scorePercent(a.score, a.maxScore)! >= a.quiz.passingScore : null,
      submittedAt: a.submittedAt,
    }))
    .slice(0, 10);

  const validPercents = scoredAttempts.map((a) => a.percent).filter((p): p is number => p !== null);
  const avgQuizScore = validPercents.length
    ? Math.round(validPercents.reduce((sum, p) => sum + p, 0) / validPercents.length)
    : null;

  const attemptedQuizSectionIds = new Set(attempts.map((a) => a.quiz.materialSectionId));
  const nextSection = sectionProgress.find((s) => s.status !== "COMPLETED") ?? null;

  let recommendation: { type: "materi" | "kuis"; label: string; href: string } | null = null;
  if (nextSection) {
    recommendation = { type: "materi", label: `Lanjutkan: ${nextSection.title}`, href: `/materi/${nextSection.slug}` };
  } else {
    const untried = sections.find((s) => !attemptedQuizSectionIds.has(s.id));
    if (untried) {
      recommendation = { type: "kuis", label: `Coba kuis: ${untried.title}`, href: `/kuis` };
    }
  }

  return {
    totalSections: sections.length,
    completedSections: completedCount,
    avgQuizScore,
    totalAttempts: attempts.length,
    sectionProgress,
    recentAttempts: scoredAttempts,
    recommendation,
  };
}

export async function getTeacherDashboard() {
  const [sections, students, attempts, progress] = await Promise.all([
    prisma.materialSection.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, title: true },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true },
    }),
    prisma.quizAttempt.findMany({
      where: { status: "SUBMITTED" },
      select: { userId: true, score: true, maxScore: true, submittedAt: true, quiz: { select: { materialSectionId: true } } },
    }),
    prisma.progress.findMany({ select: { userId: true, materialSectionId: true, status: true, lastAccessedAt: true } }),
  ]);

  const totalStudents = students.length;
  const totalSections = sections.length;

  const allPercents = attempts.map((a) => scorePercent(a.score, a.maxScore)).filter((p): p is number => p !== null);
  const classAvgScore = allPercents.length ? Math.round(allPercents.reduce((s, p) => s + p, 0) / allPercents.length) : null;

  const perSection = sections.map((section) => {
    const sectionProgressRows = progress.filter((p) => p.materialSectionId === section.id);
    const started = sectionProgressRows.length;
    const completed = sectionProgressRows.filter((p) => p.status === "COMPLETED").length;
    const sectionAttempts = attempts.filter((a) => a.quiz.materialSectionId === section.id);
    const percents = sectionAttempts.map((a) => scorePercent(a.score, a.maxScore)).filter((p): p is number => p !== null);
    const avgScore = percents.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : null;

    return {
      id: section.id,
      title: section.title,
      studentsStarted: started,
      studentsCompleted: completed,
      avgQuizScore: avgScore,
    };
  });

  const studentRows = students.map((student) => {
    const studentProgress = progress.filter((p) => p.userId === student.id);
    const completedSections = studentProgress.filter((p) => p.status === "COMPLETED").length;
    const studentAttempts = attempts.filter((a) => a.userId === student.id);
    const percents = studentAttempts.map((a) => scorePercent(a.score, a.maxScore)).filter((p): p is number => p !== null);
    const avgScore = percents.length ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length) : null;

    const lastAccessTimes = [
      ...studentProgress.map((p) => p.lastAccessedAt),
      ...studentAttempts.map((a) => a.submittedAt),
    ].filter((d): d is Date => !!d);
    const lastActive = lastAccessTimes.length
      ? new Date(Math.max(...lastAccessTimes.map((d) => d.getTime())))
      : null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      completedSections,
      totalSections,
      avgQuizScore: avgScore,
      totalAttempts: studentAttempts.length,
      lastActive,
    };
  });

  return {
    totalStudents,
    totalSections,
    classAvgScore,
    totalAttempts: attempts.length,
    perSection,
    students: studentRows,
  };
}
