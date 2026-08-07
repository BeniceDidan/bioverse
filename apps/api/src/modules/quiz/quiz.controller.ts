import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import * as quizService from "./quiz.service";

// ── Teacher ──────────────────────────────────────────────────────────────

export const generateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { materialSectionId, title, description, quizType, timeLimitMinutes, passingScore, types, count } =
    req.body;

  if (!materialSectionId || !title || !description || !quizType) {
    throw ApiError.badRequest("Submateri, judul, deskripsi, dan jenis kuis wajib diisi");
  }
  if (!Array.isArray(types) || types.length === 0) {
    throw ApiError.badRequest("Pilih minimal 1 tipe soal");
  }

  const quiz = await quizService.generateQuiz(req.user!.id, {
    materialSectionId,
    title,
    description,
    quizType,
    timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
    passingScore: passingScore ? Number(passingScore) : undefined,
    types,
    count: Number(count) || 5,
  });
  res.status(201).json({ success: true, data: { quiz } });
});

export const listQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const quizzes = await quizService.listQuizzesForTeacher(req.user!.id);
  res.status(200).json({ success: true, data: { quizzes } });
});

export const getQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.getQuizForTeacher(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { quiz } });
});

export const updateQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.updateQuiz(req.params.id, req.user!.id, req.body);
  res.status(200).json({ success: true, data: { quiz } });
});

export const publishQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.setQuizPublished(req.params.id, req.user!.id, true);
  res.status(200).json({ success: true, data: { quiz } });
});

export const unpublishQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.setQuizPublished(req.params.id, req.user!.id, false);
  res.status(200).json({ success: true, data: { quiz } });
});

export const deleteQuiz = asyncHandler(async (req: Request, res: Response) => {
  await quizService.deleteQuiz(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Kuis dihapus" } });
});

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { type, prompt, explanation, points, imageUrl, choices, pairs } = req.body;
  if (!type || !prompt || !explanation) {
    throw ApiError.badRequest("Tipe, pertanyaan, dan penjelasan wajib diisi");
  }
  const question = await quizService.createQuestion(req.params.id, req.user!.id, {
    type,
    prompt,
    explanation,
    points: Number(points) || 10,
    imageUrl,
    choices,
    pairs,
  });
  res.status(201).json({ success: true, data: { question } });
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { type, prompt, explanation, points, imageUrl, choices, pairs } = req.body;
  if (!type || !prompt || !explanation) {
    throw ApiError.badRequest("Tipe, pertanyaan, dan penjelasan wajib diisi");
  }
  const question = await quizService.updateQuestion(req.params.questionId, req.user!.id, {
    type,
    prompt,
    explanation,
    points: Number(points) || 10,
    imageUrl,
    choices,
    pairs,
  });
  res.status(200).json({ success: true, data: { question } });
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  await quizService.deleteQuestion(req.params.questionId, req.user!.id);
  res.status(200).json({ success: true, data: { message: "Soal dihapus" } });
});

// ── Public / student ─────────────────────────────────────────────────────

export const listPublicQuizzes = asyncHandler(async (_req: Request, res: Response) => {
  const quizzes = await quizService.listPublicQuizzes();
  res.status(200).json({ success: true, data: { quizzes } });
});

export const getPublicQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quiz = await quizService.getPublicQuizForTaking(req.params.id);
  res.status(200).json({ success: true, data: { quiz } });
});

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await quizService.startAttempt(req.params.id, req.user!.id);
  res.status(201).json({ success: true, data: { attempt } });
});

export const listMyAttempts = asyncHandler(async (req: Request, res: Response) => {
  const attempts = await quizService.listMyAttempts(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { attempts } });
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { questionId, selectedChoiceIds, textAnswer } = req.body;
  if (!questionId) throw ApiError.badRequest("questionId wajib diisi");
  const result = await quizService.submitAnswer(
    req.params.id,
    req.user!.id,
    questionId,
    selectedChoiceIds,
    textAnswer ?? null
  );
  res.status(200).json({ success: true, data: result });
});

export const finalizeAttempt = asyncHandler(async (req: Request, res: Response) => {
  const attempt = await quizService.finalizeAttempt(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: { attempt } });
});

export const getAttemptReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await quizService.getAttemptReview(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: review });
});
