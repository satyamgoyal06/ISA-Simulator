import type { MCQQuestion, Subject, SubjectQuestionBank, SubjectiveQuestion } from "@/lib/types";
import { SUBJECTS } from "@/lib/types";
import { OS_MCQ_QUESTIONS, OS_SUBJECTIVE_QUESTIONS } from "@/data/osQuestions";
import { OS_CODE_QUESTIONS } from "@/data/osCodeQuestions";

/* ── Placeholder generator for subjects without real data ── */

const TOPICS_UNIT_1 = [
  "Fundamentals",
  "Architecture",
  "Process Models",
  "Memory Concepts",
  "Algorithm Basics",
  "Core Definitions"
];

const TOPICS_UNIT_2 = [
  "Scheduling",
  "Optimization",
  "Security",
  "Concurrency",
  "Analysis",
  "Advanced Applications"
];

function generateMcqForSubject(subject: Subject): MCQQuestion[] {
  const questions: MCQQuestion[] = [];

  for (let index = 1; index <= 15; index += 1) {
    const topic = TOPICS_UNIT_1[(index - 1) % TOPICS_UNIT_1.length];
    questions.push({
      kind: "mcq",
      id: `${subject}-MCQ-U1-${index}`,
      subject,
      unit: 1,
      topic,
      prompt: `${subject} Unit 1 (${topic}) Question ${index}: Choose the best statement.`,
      options: [
        `Correct principle for ${subject} ${topic} (${index})`,
        `Partially correct interpretation for ${subject} ${topic} (${index})`,
        `Incorrect interpretation for ${subject} ${topic} (${index})`,
        `Unrelated statement for ${subject} ${topic} (${index})`
      ],
      correctOptionIndex: 0,
      explanation: `Option 1 is correct because it states the core ${topic} principle from Unit 1.`
    });
  }

  for (let index = 1; index <= 15; index += 1) {
    const topic = TOPICS_UNIT_2[(index - 1) % TOPICS_UNIT_2.length];
    questions.push({
      kind: "mcq",
      id: `${subject}-MCQ-U2-${index}`,
      subject,
      unit: 2,
      topic,
      prompt: `${subject} Unit 2 (${topic}) Question ${index}: Which option best fits the scenario?`,
      options: [
        `Incorrect approach for ${subject} ${topic} (${index})`,
        `Correct approach for ${subject} ${topic} (${index})`,
        `Outdated approach for ${subject} ${topic} (${index})`,
        `Irrelevant approach for ${subject} ${topic} (${index})`
      ],
      correctOptionIndex: 1,
      explanation: `Option 2 best applies ${topic} to this Unit 2 use case.`
    });
  }

  return questions;
}

function generateSubjectiveForSubject(subject: Subject): SubjectiveQuestion[] {
  const questions: SubjectiveQuestion[] = [];

  for (let index = 1; index <= 4; index += 1) {
    const topic = TOPICS_UNIT_1[(index - 1) % TOPICS_UNIT_1.length];
    questions.push({
      kind: "subjective",
      id: `${subject}-SUB-U1-${index}`,
      subject,
      unit: 1,
      topic,
      prompt: `${subject} Unit 1 (${topic}) Subjective ${index}: Explain the concept in your own words with an example.`,
      idealAnswer: `A strong answer should define ${topic}, explain its role in ${subject}, and provide one practical example.`,
      keywords: [topic.toLowerCase(), subject.toLowerCase(), "example", "role"],
      explanation: `Focus on definition, role, and an applied example for ${topic}.`
    });
  }

  for (let index = 1; index <= 4; index += 1) {
    const topic = TOPICS_UNIT_2[(index - 1) % TOPICS_UNIT_2.length];
    questions.push({
      kind: "subjective",
      id: `${subject}-SUB-U2-${index}`,
      subject,
      unit: 2,
      topic,
      prompt: `${subject} Unit 2 (${topic}) Subjective ${index}: Analyze this topic and describe a strategy to improve performance/outcomes.`,
      idealAnswer: `A complete answer should explain ${topic}, identify trade-offs, and justify a strategy for ${subject}.`,
      keywords: [topic.toLowerCase(), "trade-off", "strategy", "analysis"],
      explanation: `Good responses explicitly discuss trade-offs and justify their chosen strategy.`
    });
  }

  return questions;
}

function generateBank(subject: Subject): SubjectQuestionBank {
  return {
    mcq: generateMcqForSubject(subject),
    subjective: generateSubjectiveForSubject(subject)
  };
}

/* ── Build the question bank ─────────────────────────── */

export const QUESTION_BANK: Record<Subject, SubjectQuestionBank> = {
  OS: {
    mcq: [...OS_MCQ_QUESTIONS, ...OS_CODE_QUESTIONS],
    subjective: OS_SUBJECTIVE_QUESTIONS
  },
  MPCA: generateBank("MPCA"),
  CN: generateBank("CN"),
  LA: generateBank("LA"),
  DAA: generateBank("DAA")
};

export function isValidSubject(value: string): value is Subject {
  return SUBJECTS.includes(value as Subject);
}
