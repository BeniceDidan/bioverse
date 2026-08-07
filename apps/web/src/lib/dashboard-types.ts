export interface SectionProgress {
  id: string;
  slug: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progressPercent: number;
}

export interface RecentAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

export interface StudentDashboard {
  totalSections: number;
  completedSections: number;
  avgQuizScore: number | null;
  totalAttempts: number;
  sectionProgress: SectionProgress[];
  recentAttempts: RecentAttempt[];
  recommendation: { type: "materi" | "kuis"; label: string; href: string } | null;
}

export interface SectionBreakdown {
  id: string;
  title: string;
  studentsStarted: number;
  studentsCompleted: number;
  avgQuizScore: number | null;
}

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  completedSections: number;
  totalSections: number;
  avgQuizScore: number | null;
  totalAttempts: number;
  lastActive: string | null;
}

export interface TeacherDashboard {
  totalStudents: number;
  totalSections: number;
  classAvgScore: number | null;
  totalAttempts: number;
  perSection: SectionBreakdown[];
  students: StudentRow[];
}
