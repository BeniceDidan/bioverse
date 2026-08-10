import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth";
import { csrfProtection } from "../../middleware/security";
import * as quizController from "./quiz.controller";

export const teacherQuizRouter = Router();

teacherQuizRouter.use(requireAuth, requireRole("TEACHER"));

teacherQuizRouter.post("/generate", csrfProtection, quizController.generateQuiz);
teacherQuizRouter.get("/quizzes", quizController.listQuizzes);
teacherQuizRouter.get("/quizzes/:id", quizController.getQuiz);
teacherQuizRouter.patch("/quizzes/:id", csrfProtection, quizController.updateQuiz);
teacherQuizRouter.post("/quizzes/:id/publish", csrfProtection, quizController.publishQuiz);
teacherQuizRouter.post("/quizzes/:id/unpublish", csrfProtection, quizController.unpublishQuiz);
// Before "/quizzes/:id" so "all" isn't mistaken for a quiz id.
teacherQuizRouter.delete("/quizzes/all", csrfProtection, quizController.deleteAllQuizzes);
teacherQuizRouter.delete("/quizzes/:id", csrfProtection, quizController.deleteQuiz);
teacherQuizRouter.post("/quizzes/:id/questions", csrfProtection, quizController.createQuestion);
teacherQuizRouter.patch("/questions/:questionId", csrfProtection, quizController.updateQuestion);
teacherQuizRouter.delete("/questions/:questionId", csrfProtection, quizController.deleteQuestion);

export const quizRouter = Router();

// Listing/viewing published quizzes is public (server-rendered without a
// session, same as materi/microscope/video) — only attempts need to know
// who's taking the quiz.
quizRouter.get("/quizzes", quizController.listPublicQuizzes);
quizRouter.get("/quizzes/:id", quizController.getPublicQuiz);
quizRouter.get("/quizzes/:id/attempts", requireAuth, quizController.listMyAttempts);
quizRouter.post("/quizzes/:id/attempts", requireAuth, csrfProtection, quizController.startAttempt);
quizRouter.post("/attempts/:id/answers", requireAuth, csrfProtection, quizController.submitAnswer);
quizRouter.post("/attempts/:id/submit", requireAuth, csrfProtection, quizController.finalizeAttempt);
quizRouter.get("/attempts/:id/review", requireAuth, quizController.getAttemptReview);
