import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { generateQuizQuestions, type AiQuestion } from "./quiz.ai";

// ── Shared helpers ──────────────────────────────────────────────────────

function choicesDataFor(q: AiQuestion | ManualQuestionInput) {
  if (q.type === "MATCHING" || q.type === "DRAG_DROP") {
    const pairs = q.pairs ?? [];
    return pairs.flatMap((pair, i) => {
      const matchKey = crypto.randomUUID();
      return [
        { text: pair.prompt, isCorrect: false, matchKey, matchGroup: "PROMPT", order: i },
        { text: pair.answer, isCorrect: false, matchKey, matchGroup: "ANSWER", order: i },
      ];
    });
  }
  if (q.type === "ESSAY") return [];
  return (q.choices ?? []).map((c, i) => ({ text: c.text, isCorrect: c.isCorrect, order: i }));
}

interface ManualQuestionInput {
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MATCHING" | "DRAG_DROP" | "IMAGE_IDENTIFICATION" | "ESSAY";
  prompt: string;
  explanation: string;
  points: number;
  imageUrl?: string | null;
  choices?: { text: string; isCorrect: boolean }[];
  pairs?: { prompt: string; answer: string }[];
}

// ── Teacher: generation & management ────────────────────────────────────

interface GenerateQuizInput {
  materialSectionId: string;
  title: string;
  description: string;
  quizType: "PRETEST" | "POSTTEST" | "PRACTICE";
  timeLimitMinutes?: number;
  passingScore?: number;
  types: string[];
  count: number;
}

export async function generateQuiz(teacherId: string, input: GenerateQuizInput) {
  const section = await prisma.materialSection.findUnique({ where: { id: input.materialSectionId } });
  if (!section) throw ApiError.badRequest("Submateri tidak ditemukan");

  const aiQuestions = await generateQuizQuestions(section.contentBody, input.types, input.count);

  const quiz = await prisma.quiz.create({
    data: {
      materialSectionId: input.materialSectionId,
      teacherId,
      type: input.quizType,
      title: input.title,
      description: input.description,
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore ?? 70,
      isPublished: false,
      questions: {
        create: aiQuestions.map((q, i) => ({
          type: q.type,
          prompt: q.prompt,
          explanation: q.explanation,
          points: q.points || 10,
          order: i,
          choices: { create: choicesDataFor(q) },
        })),
      },
    },
    include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } },
  });

  return quiz;
}

export async function listQuizzesForTeacher(teacherId: string) {
  return prisma.quiz.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: {
      materialSection: { select: { id: true, title: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

async function getOwnedQuiz(quizId: string, teacherId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.teacherId !== teacherId) throw ApiError.notFound("Kuis tidak ditemukan");
  return quiz;
}

export async function getQuizForTeacher(quizId: string, teacherId: string) {
  await getOwnedQuiz(quizId, teacherId);
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      materialSection: { select: { id: true, title: true } },
      questions: { include: { choices: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
    },
  });
}

export async function updateQuiz(
  quizId: string,
  teacherId: string,
  data: Partial<{ title: string; description: string; timeLimitMinutes: number | null; passingScore: number }>
) {
  await getOwnedQuiz(quizId, teacherId);
  return prisma.quiz.update({ where: { id: quizId }, data });
}

export async function setQuizPublished(quizId: string, teacherId: string, isPublished: boolean) {
  await getOwnedQuiz(quizId, teacherId);
  if (isPublished) {
    const count = await prisma.question.count({ where: { quizId } });
    if (count === 0) throw ApiError.badRequest("Tambahkan minimal 1 soal sebelum menerbitkan kuis");
  }
  return prisma.quiz.update({ where: { id: quizId }, data: { isPublished } });
}

export async function deleteQuiz(quizId: string, teacherId: string) {
  await getOwnedQuiz(quizId, teacherId);
  await prisma.quiz.delete({ where: { id: quizId } });
}

export async function createQuestion(quizId: string, teacherId: string, input: ManualQuestionInput) {
  await getOwnedQuiz(quizId, teacherId);
  const count = await prisma.question.count({ where: { quizId } });
  return prisma.question.create({
    data: {
      quizId,
      type: input.type,
      prompt: input.prompt,
      explanation: input.explanation,
      points: input.points || 10,
      imageUrl: input.imageUrl ?? null,
      order: count,
      choices: { create: choicesDataFor(input) },
    },
    include: { choices: { orderBy: { order: "asc" } } },
  });
}

async function getOwnedQuestion(questionId: string, teacherId: string) {
  const question = await prisma.question.findUnique({ where: { id: questionId }, include: { quiz: true } });
  if (!question || question.quiz.teacherId !== teacherId) throw ApiError.notFound("Soal tidak ditemukan");
  return question;
}

export async function updateQuestion(questionId: string, teacherId: string, input: ManualQuestionInput) {
  await getOwnedQuestion(questionId, teacherId);
  await prisma.choice.deleteMany({ where: { questionId } });
  return prisma.question.update({
    where: { id: questionId },
    data: {
      type: input.type,
      prompt: input.prompt,
      explanation: input.explanation,
      points: input.points || 10,
      imageUrl: input.imageUrl ?? null,
      choices: { create: choicesDataFor(input) },
    },
    include: { choices: { orderBy: { order: "asc" } } },
  });
}

export async function deleteQuestion(questionId: string, teacherId: string) {
  await getOwnedQuestion(questionId, teacherId);
  await prisma.question.delete({ where: { id: questionId } });
}

// ── Public: listing & taking ────────────────────────────────────────────

export async function listPublicQuizzes() {
  return prisma.quiz.findMany({
    where: { isPublished: true },
    orderBy: [{ materialSection: { order: "asc" } }, { createdAt: "asc" }],
    include: {
      materialSection: { select: { id: true, title: true } },
      _count: { select: { questions: true } },
    },
  });
}

function sanitizeQuestionForTaking(q: {
  id: string;
  type: string;
  prompt: string;
  imageUrl: string | null;
  points: number;
  order: number;
  choices: { id: string; text: string; matchGroup: string | null }[];
}) {
  return {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    imageUrl: q.imageUrl,
    points: q.points,
    order: q.order,
    choices: q.choices.map((c) => ({ id: c.id, text: c.text, matchGroup: c.matchGroup })),
  };
}

export async function getPublicQuizForTaking(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      materialSection: { select: { id: true, title: true } },
      questions: { include: { choices: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
    },
  });
  if (!quiz || !quiz.isPublished) throw ApiError.notFound("Kuis tidak ditemukan");

  return { ...quiz, questions: quiz.questions.map(sanitizeQuestionForTaking) };
}

export async function startAttempt(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz || !quiz.isPublished) throw ApiError.notFound("Kuis tidak ditemukan");

  const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return prisma.quizAttempt.create({
    data: { quizId, userId, status: "IN_PROGRESS", maxScore },
  });
}

async function getOwnedAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) throw ApiError.notFound("Percobaan kuis tidak ditemukan");
  return attempt;
}

function gradeAnswer(
  question: { type: string; points: number; choices: { id: string; isCorrect: boolean; matchKey: string | null; matchGroup: string | null }[] },
  selectedChoiceIds: unknown,
  // Kept in the signature to mirror the stored answer shape, but unread:
  // ESSAY is deliberately left ungraded here (null / 0 points) for a human
  // to score, and no other question type carries free text.
  _textAnswer: string | null
): { isCorrect: boolean | null; pointsAwarded: number } {
  if (question.type === "ESSAY") {
    return { isCorrect: null, pointsAwarded: 0 };
  }

  if (question.type === "MATCHING" || question.type === "DRAG_DROP") {
    const mapping = (selectedChoiceIds ?? {}) as Record<string, string>;
    const promptChoices = question.choices.filter((c) => c.matchGroup === "PROMPT");
    if (promptChoices.length === 0) return { isCorrect: false, pointsAwarded: 0 };

    let correctPairs = 0;
    for (const prompt of promptChoices) {
      const answeredId = mapping[prompt.id];
      const answered = question.choices.find((c) => c.id === answeredId);
      if (answered && answered.matchGroup === "ANSWER" && answered.matchKey === prompt.matchKey) {
        correctPairs++;
      }
    }
    const ratio = correctPairs / promptChoices.length;
    return { isCorrect: ratio === 1, pointsAwarded: Math.round(question.points * ratio) };
  }

  // MULTIPLE_CHOICE, TRUE_FALSE, IMAGE_IDENTIFICATION
  const ids = Array.isArray(selectedChoiceIds) ? (selectedChoiceIds as string[]) : [];
  const chosenId = ids[0];
  const chosen = question.choices.find((c) => c.id === chosenId);
  const isCorrect = !!chosen?.isCorrect;
  return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
}

export async function submitAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  selectedChoiceIds: unknown,
  textAnswer: string | null
) {
  const attempt = await getOwnedAttempt(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") throw ApiError.badRequest("Percobaan kuis sudah selesai");

  const question = await prisma.question.findUnique({ where: { id: questionId }, include: { choices: true } });
  if (!question || question.quizId !== attempt.quizId) throw ApiError.badRequest("Soal tidak ditemukan");

  const { isCorrect, pointsAwarded } = gradeAnswer(question, selectedChoiceIds, textAnswer);

  const answer = await prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    update: { selectedChoiceIds: selectedChoiceIds ?? [], textAnswer, isCorrect, pointsAwarded },
    create: {
      attemptId,
      questionId,
      selectedChoiceIds: selectedChoiceIds ?? [],
      textAnswer,
      isCorrect,
      pointsAwarded,
    },
  });

  const correctPairs: Record<string, string> | undefined =
    question.type === "MATCHING" || question.type === "DRAG_DROP"
      ? Object.fromEntries(
          question.choices
            .filter((c) => c.matchGroup === "PROMPT")
            .map((prompt) => [
              prompt.id,
              question.choices.find((c) => c.matchGroup === "ANSWER" && c.matchKey === prompt.matchKey)?.id ?? "",
            ])
        )
      : undefined;

  return {
    answer,
    explanation: question.explanation,
    correctChoiceIds: question.choices.filter((c) => c.isCorrect).map((c) => c.id),
    correctPairs,
  };
}

export async function finalizeAttempt(attemptId: string, userId: string) {
  const attempt = await getOwnedAttempt(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") throw ApiError.badRequest("Percobaan kuis sudah selesai");

  const answers = await prisma.answer.findMany({ where: { attemptId } });
  const score = answers.reduce((sum, a) => sum + a.pointsAwarded, 0);

  return prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { status: "SUBMITTED", submittedAt: new Date(), score },
  });
}

export async function getAttemptReview(attemptId: string, userId: string) {
  const attempt = await getOwnedAttempt(attemptId, userId);
  const quiz = await prisma.quiz.findUnique({
    where: { id: attempt.quizId },
    include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } },
  });
  const answers = await prisma.answer.findMany({ where: { attemptId } });

  return { attempt, quiz, answers };
}

export async function listMyAttempts(quizId: string, userId: string) {
  return prisma.quizAttempt.findMany({
    where: { quizId, userId },
    orderBy: { startedAt: "desc" },
  });
}
