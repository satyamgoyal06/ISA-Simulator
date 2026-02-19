export const SUBJECTS = ["OS", "MPCA", "CN", "LA", "DAA"] as const;

export type Subject = (typeof SUBJECTS)[number];
export type Unit = 1 | 2;

type BaseQuestion = {
  id: string;
  subject: Subject;
  unit: Unit;
  topic: string;
  topicSlug?: string;
  prompt: string;
  explanation?: string;
};

export type MCQQuestion = BaseQuestion & {
  kind: "mcq";
  options: [string, string, string, string];
  correctOptionIndex: number;
};

export type SubjectiveQuestion = BaseQuestion & {
  kind: "subjective";
  idealAnswer: string;
  keywords: string[];
};

export type SubjectQuestionBank = {
  mcq: MCQQuestion[];
  subjective: SubjectiveQuestion[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

/* ---- Theory Content ---- */

export type TheoryContent = {
  topicSlug: string;
  topicName: string;
  unit: Unit;
  subject: Subject;
  summary: string;
  keyPoints: string[];
  commonMistakes: string[];
};

/* ---- User Profiling ---- */

export type TopicStats = {
  topicSlug: string;
  totalAttempted: number;
  totalCorrect: number;
  recentWrongIds: string[];
  lastAttemptedAt: string;
};

export type TestHistoryEntry = {
  date: string;
  score: number;
  totalQuestions: number;
  weakTopics: string[];
  mode: "test" | "practice" | "review";
};

export type SubjectProfile = {
  testsCompleted: number;
  practiceSessionsCompleted: number;
  topicStats: Record<string, TopicStats>;
  history: TestHistoryEntry[];
};

export type UserProfile = {
  userId: string;
  subjectStats: Partial<Record<Subject, SubjectProfile>>;
};
