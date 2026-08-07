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
teacherQuizRouter.delete("/quizzes/:id", csrfProtection, quizController.deleteQuiz);
teacherQuizRouter.post("/quizzes/:id/questions", csrfProtection, quizController.createQuestion);
teacherQuizRouter.patch("/questions/:questionId", csrfProtection, quizController.updateQuestion);
teacherQuizRouter.delete("/questions/:questionId", csrfProtection, quizController.deleteQuestion);

export const quizRouter = Router();

quizRouter.use(requireAuth);

quizRouter.get("/quizzes", quizController.listPublicQuizzes);
quizRouter.get("/quizzes/:id", quizController.getPublicQuiz);
quizRouter.get("/quizzes/:id/attempts", quizController.listMyAttempts);
quizRouter.post("/quizzes/:id/attempts", csrfProtection, quizController.startAttempt);
quizRouter.post("/attempts/:id/answers", csrfProtection, quizController.submitAnswer);
quizRouter.post("/attempts/:id/submit", csrfProtection, quizController.finalizeAttempt);
quizRouter.get("/attempts/:id/review", quizController.getAttemptReview);
