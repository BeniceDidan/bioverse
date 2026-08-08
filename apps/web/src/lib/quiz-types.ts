export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "MATCHING"
  | "IMAGE_IDENTIFICATION"
  | "DRAG_DROP"
  | "ESSAY";

export type QuizType = "PRETEST" | "POSTTEST" | "PRACTICE";

export interface QuizChoiceOption {
  id: string;
  text: string;
  matchGroup: "PROMPT" | "ANSWER" | null;
}

export interface QuizChoiceFull extends QuizChoiceOption {
  isCorrect: boolean;
  matchKey: string | null;
}

export interface QuizQuestionForTaking {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl: string | null;
  points: number;
  order: number;
  choices: QuizChoiceOption[];
}

export interface QuizQuestionFull extends Omit<QuizQuestionForTaking, "choices"> {
  explanation: string;
  choices: QuizChoiceFull[];
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string;
  type: QuizType;
  isPublished: boolean;
  timeLimitMinutes: number | null;
  passingScore: number;
  createdAt: string;
  // Nullable: a quiz survives its submateri being deleted (server-side
  // SetNull) rather than being deleted along with it, so this can be null
  // for an orphaned quiz.
  materialSection: { id: string; title: string } | null;
  _count?: { questions: number; attempts?: number };
}

export interface QuizForTaking extends QuizSummary {
  questions: QuizQuestionForTaking[];
}

export interface QuizFull extends QuizSummary {
  questions: QuizQuestionFull[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
  score: number | null;
  maxScore: number | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface SubmitAnswerResult {
  answer: {
    id: string;
    questionId: string;
    isCorrect: boolean | null;
    pointsAwarded: number;
    selectedChoiceIds: unknown;
    textAnswer: string | null;
  };
  explanation: string;
  correctChoiceIds: string[];
  correctPairs?: Record<string, string>;
}
