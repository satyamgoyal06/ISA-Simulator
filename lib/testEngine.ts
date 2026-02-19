import type { MCQQuestion, SubjectiveQuestion } from "@/lib/types";

function shuffled<T>(arr: T[]) {
  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/* ── Topic-balanced selection ─────────────────────────── */

function pickTopicBalancedByUnit<T extends { id: string; unit: 1 | 2; topicSlug?: string; topic: string }>(
  pool: T[],
  totalQuestions: number
): T[] {
  const perUnit = Math.floor(totalQuestions / 2);

  const unit1 = pool.filter((q) => q.unit === 1);
  const unit2 = pool.filter((q) => q.unit === 2);

  const pickFromUnit = (unitPool: T[], count: number): T[] => {
    // Group by topic
    const byTopic: Record<string, T[]> = {};
    for (const q of unitPool) {
      const slug = q.topicSlug ?? q.topic;
      if (!byTopic[slug]) byTopic[slug] = [];
      byTopic[slug].push(q);
    }

    // Shuffle within each topic
    const topicSlugs = Object.keys(byTopic);
    for (const slug of topicSlugs) {
      byTopic[slug] = shuffled(byTopic[slug]);
    }

    // Round-robin across topics
    const selected: T[] = [];
    const selectedIds = new Set<string>();
    let round = 0;

    while (selected.length < count) {
      let addedThisRound = false;

      for (const slug of shuffled(topicSlugs)) {
        if (selected.length >= count) break;
        if (round < byTopic[slug].length) {
          const q = byTopic[slug][round];
          if (!selectedIds.has(q.id)) {
            selected.push(q);
            selectedIds.add(q.id);
            addedThisRound = true;
          }
        }
      }

      if (!addedThisRound) break;
      round += 1;
    }

    return selected;
  };

  const selected1 = pickFromUnit(unit1, perUnit);
  const selected2 = pickFromUnit(unit2, perUnit);
  let combined = [...selected1, ...selected2];

  // Fill remaining if needed
  if (combined.length < totalQuestions) {
    const selectedIds = new Set(combined.map((q) => q.id));
    const remaining = shuffled(pool).filter((q) => !selectedIds.has(q.id));
    combined.push(...remaining.slice(0, totalQuestions - combined.length));
  }

  return shuffled(combined).slice(0, totalQuestions);
}

export function buildBalancedMcqTest(questions: MCQQuestion[], totalQuestions = 24): MCQQuestion[] {
  return pickTopicBalancedByUnit(questions, totalQuestions);
}

export function buildBalancedSubjectiveTest(
  questions: SubjectiveQuestion[],
  totalQuestions = 4
): SubjectiveQuestion[] {
  return pickTopicBalancedByUnit(questions, totalQuestions);
}

/* ── Targeted MCQs for weak topics ────────────────────── */

export function buildTargetedMcqSet(params: {
  allMcqQuestions: MCQQuestion[];
  weakTopicSlugs: string[];
  excludeQuestionIds?: string[];
  totalQuestions?: number;
}): MCQQuestion[] {
  const totalQuestions = params.totalQuestions ?? 10;
  const excluded = new Set(params.excludeQuestionIds ?? []);
  const topicSet = new Set(params.weakTopicSlugs);

  const available = params.allMcqQuestions.filter((q) => !excluded.has(q.id));
  const priority = shuffled(available.filter((q) => topicSet.has(q.topicSlug ?? q.topic)));
  const nonPriority = shuffled(available.filter((q) => !topicSet.has(q.topicSlug ?? q.topic)));

  const selected: MCQQuestion[] = [];

  for (const q of priority) {
    if (selected.length >= totalQuestions) break;
    selected.push(q);
  }

  for (const q of nonPriority) {
    if (selected.length >= totalQuestions) break;
    selected.push(q);
  }

  return shuffled(selected);
}

/* ── Grading ──────────────────────────────────────────── */

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isSubjectiveAnswerCorrect(question: SubjectiveQuestion, answer?: string): boolean {
  if (!answer || !answer.trim()) {
    return false;
  }

  const normalizedAnswer = normalize(answer);
  const hits = question.keywords.reduce(
    (total, keyword) => (normalizedAnswer.includes(normalize(keyword)) ? total + 1 : total),
    0
  );
  const requiredHits = Math.max(1, Math.ceil(question.keywords.length / 2));

  return hits >= requiredHits;
}

export type TestGradeReport = {
  totalQuestions: number;
  totalCorrect: number;
  mcqCorrect: number;
  subjectiveCorrect: number;
  wrongMcq: MCQQuestion[];
  wrongSubjective: SubjectiveQuestion[];
};

export function gradeSubmission(params: {
  mcqQuestions: MCQQuestion[];
  subjectiveQuestions: SubjectiveQuestion[];
  mcqAnswers: Record<string, number | undefined>;
  subjectiveAnswers: Record<string, string | undefined>;
}): TestGradeReport {
  const mcqCorrect = params.mcqQuestions.reduce((total, question) => {
    return params.mcqAnswers[question.id] === question.correctOptionIndex ? total + 1 : total;
  }, 0);

  const subjectiveCorrect = params.subjectiveQuestions.reduce((total, question) => {
    return isSubjectiveAnswerCorrect(question, params.subjectiveAnswers[question.id]) ? total + 1 : total;
  }, 0);

  const wrongMcq = params.mcqQuestions.filter(
    (question) => params.mcqAnswers[question.id] !== question.correctOptionIndex
  );

  const wrongSubjective = params.subjectiveQuestions.filter(
    (question) => !isSubjectiveAnswerCorrect(question, params.subjectiveAnswers[question.id])
  );

  return {
    totalQuestions: params.mcqQuestions.length + params.subjectiveQuestions.length,
    totalCorrect: mcqCorrect + subjectiveCorrect,
    mcqCorrect,
    subjectiveCorrect,
    wrongMcq,
    wrongSubjective
  };
}

export function extractWeakTopics(report: TestGradeReport): string[] {
  return Array.from(
    new Set([...report.wrongMcq.map((q) => q.topicSlug ?? q.topic), ...report.wrongSubjective.map((q) => q.topicSlug ?? q.topic)])
  );
}

export function buildFollowupBank(params: {
  allMcqQuestions: MCQQuestion[];
  weakTopics: string[];
  excludeQuestionIds?: string[];
  totalQuestions?: number;
}): MCQQuestion[] {
  return buildTargetedMcqSet({
    allMcqQuestions: params.allMcqQuestions,
    weakTopicSlugs: params.weakTopics,
    excludeQuestionIds: params.excludeQuestionIds,
    totalQuestions: params.totalQuestions
  });
}
