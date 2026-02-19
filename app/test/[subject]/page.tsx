"use client";

import AuthGate from "@/components/AuthGate";
import TopBar from "@/components/TopBar";
import { QUESTION_BANK, isValidSubject } from "@/data/questionBank";
import { OS_THEORY } from "@/data/osTheory";
import {
  buildBalancedMcqTest,
  buildBalancedSubjectiveTest,
  buildFollowupBank,
  extractWeakTopics,
  gradeSubmission
} from "@/lib/testEngine";
import { supabase } from "@/lib/supabaseClient";
import { recordResults } from "@/lib/userProfile";
import type { MCQQuestion, Subject, TheoryContent } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TestPageProps = {
  params: {
    subject: string;
  };
};

const TEST_DURATION_SECONDS = 60 * 60;

export default function SubjectTestPage({ params }: TestPageProps) {
  if (!isValidSubject(params.subject)) {
    return (
      <main className="page-wrap">
        <section className="card">
          <h1>Invalid subject</h1>
          <Link href="/dashboard">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  return (
    <AuthGate>
      <TestRunner subject={params.subject as Subject} />
    </AuthGate>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function TestRunner({ subject }: { subject: Subject }) {
  const bank = QUESTION_BANK[subject];
  const mcqQuestions = useMemo(() => buildBalancedMcqTest(bank.mcq, 24), [bank.mcq]);
  const subjectiveQuestions = useMemo(() => buildBalancedSubjectiveTest(bank.subjective, 4), [bank.subjective]);

  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number | undefined>>({});
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<Record<string, string | undefined>>({});
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TEST_DURATION_SECONDS);
  const [activeSection, setActiveSection] = useState<"mcq" | "subjective">("mcq");
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showTheory, setShowTheory] = useState(false);

  const report = useMemo(
    () =>
      gradeSubmission({
        mcqQuestions,
        subjectiveQuestions,
        mcqAnswers,
        subjectiveAnswers
      }),
    [mcqQuestions, subjectiveQuestions, mcqAnswers, subjectiveAnswers]
  );

  const weakTopics = useMemo(() => extractWeakTopics(report), [report]);
  const followupBank = useMemo(
    () =>
      buildFollowupBank({
        allMcqQuestions: bank.mcq,
        weakTopics,
        excludeQuestionIds: mcqQuestions.map((question) => question.id),
        totalQuestions: 10
      }),
    [bank.mcq, weakTopics, mcqQuestions]
  );

  const theoryForWeakTopics = useMemo(() => {
    if (subject !== "OS") return [];
    return OS_THEORY.filter((t) => weakTopics.includes(t.topicSlug));
  }, [subject, weakTopics]);

  useEffect(() => {
    if (submitted) return;

    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, submitted]);

  useEffect(() => {
    if (!submitted || weakTopics.length === 0) return;

    let cancelled = false;

    async function generateExplanation() {
      setAiLoading(true);

      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, weakTopics })
        });

        const data = (await response.json()) as { explanation?: string; error?: string };

        if (!cancelled) {
          setAiExplanation(data.explanation ?? data.error ?? "Unable to generate explanation right now.");
        }
      } catch {
        if (!cancelled) {
          setAiExplanation("Unable to generate AI explanation right now.");
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }

    generateExplanation();
    return () => { cancelled = true; };
  }, [submitted, subject, weakTopics]);

  function handleSubmit() {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Record to user profile
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const correctMcq = mcqQuestions.filter((q) => mcqAnswers[q.id] === q.correctOptionIndex);
        const wrongMcq = mcqQuestions.filter((q) => mcqAnswers[q.id] !== q.correctOptionIndex);
        recordResults(user.id, subject, "test", correctMcq, wrongMcq);
      }
    });
  }

  function onSelectMcq(questionId: string, optionIndex: number) {
    setMcqAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function onSubjectiveChange(questionId: string, answer: string) {
    setSubjectiveAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  const attemptedMcq = Object.keys(mcqAnswers).length;
  const attemptedSubjective = Object.values(subjectiveAnswers).filter((a) => Boolean(a?.trim())).length;

  return (
    <main className="page-wrap">
      <section className="card wide-card">
        <TopBar />
        <h1>{subject} Test</h1>

        <div className="row">
          <p>
            Timer: <strong>{formatTime(secondsLeft)}</strong>
          </p>
          <p>
            Attempted MCQ: {attemptedMcq}/24 | Attempted Subjective: {attemptedSubjective}/4
          </p>
        </div>

        <div className="row">
          <button
            className={`btn ${activeSection === "mcq" ? "" : "btn-secondary"}`}
            type="button"
            onClick={() => setActiveSection("mcq")}
          >
            MCQ Section
          </button>
          <button
            className={`btn ${activeSection === "subjective" ? "" : "btn-secondary"}`}
            type="button"
            onClick={() => setActiveSection("subjective")}
          >
            Subjective Section
          </button>
        </div>

        {submitted ? (
          <div className="result-box">
            <h2>
              Score: {report.totalCorrect}/{report.totalQuestions}
            </h2>
            <p>
              MCQ: {report.mcqCorrect}/24 | Subjective: {report.subjectiveCorrect}/4
            </p>
            <p>Wrong answers are highlighted below.</p>
            <div className="row">
              <Link className="btn" href={`/review/${subject}`}>
                Review Weak Topics
              </Link>
              <Link className="btn btn-secondary" href={`/test/${subject}`}>
                Retake
              </Link>
              <Link className="btn btn-ghost" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>
        ) : null}

        {activeSection === "mcq" ? (
          <div className="question-list">
            {mcqQuestions.map((question, index) => {
              const isWrong = submitted && mcqAnswers[question.id] !== question.correctOptionIndex;
              return (
                <article className={`question-card ${isWrong ? "question-wrong" : ""}`} key={question.id}>
                  <p className="question-title">
                    MCQ {index + 1}. [{`Unit ${question.unit}`} | {formatSlug(question.topicSlug ?? question.topic)}]{" "}
                    <span style={{ whiteSpace: "pre-wrap" }}>{question.prompt}</span>
                  </p>
                  <div className="stack">
                    {question.options.map((option, optionIndex) => {
                      const checked = mcqAnswers[question.id] === optionIndex;
                      return (
                        <label className={`option ${checked ? "selected" : ""}`} key={optionIndex}>
                          <input
                            type="radio"
                            name={question.id}
                            checked={checked}
                            onChange={() => onSelectMcq(question.id, optionIndex)}
                            disabled={submitted}
                          />
                          <span style={{ whiteSpace: "pre-wrap" }}>{option}</span>
                        </label>
                      );
                    })}
                  </div>

                  {submitted ? (
                    <p className={isWrong ? "error" : "ok"}>
                      Correct answer: {question.options[question.correctOptionIndex]}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="question-list">
            {subjectiveQuestions.map((question, index) => {
              const answer = subjectiveAnswers[question.id] ?? "";
              const isWrong = submitted && report.wrongSubjective.some((item) => item.id === question.id);
              return (
                <article className={`question-card ${isWrong ? "question-wrong" : ""}`} key={question.id}>
                  <p className="question-title">
                    Subjective {index + 1}. [{`Unit ${question.unit}`} | {formatSlug(question.topicSlug ?? question.topic)}]{" "}
                    {question.prompt}
                  </p>
                  <textarea
                    className="subjective-input"
                    value={answer}
                    onChange={(event) => onSubjectiveChange(question.id, event.target.value)}
                    rows={5}
                    disabled={submitted}
                    placeholder="Type your answer here"
                  />
                  {submitted ? (
                    <p className={isWrong ? "error" : "ok"}>Ideal answer: {question.idealAnswer}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        {!submitted ? (
          <button className="btn" type="button" onClick={handleSubmit}>
            Submit Test
          </button>
        ) : null}

        {/* Post-submit: Theory for weak topics */}
        {submitted && theoryForWeakTopics.length > 0 ? (
          <section className="card theory-section">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <h2>📖 Study Material for Weak Topics</h2>
              <button className="btn btn-small btn-secondary" type="button" onClick={() => setShowTheory(!showTheory)}>
                {showTheory ? "Hide" : "Show"}
              </button>
            </div>
            {showTheory ? (
              theoryForWeakTopics.map((theory) => (
                <TheoryCardCollapsible key={theory.topicSlug} theory={theory} />
              ))
            ) : null}
          </section>
        ) : null}

        {/* AI Explanation */}
        {submitted ? (
          <section className="card">
            <h2>🤖 AI Topic Explanation</h2>
            {weakTopics.length === 0 ? (
              <p>No weak topics detected. Great job.</p>
            ) : (
              <>
                <p>Weak topics: {weakTopics.map(formatSlug).join(", ")}</p>
                <p>{aiLoading ? "Generating explanation..." : aiExplanation}</p>
              </>
            )}
          </section>
        ) : null}

        {/* Follow-up bank */}
        {submitted ? (
          <section className="card">
            <h2>Recommended 10-Question Improvement Bank</h2>
            <p>Practice these questions focused on your weak topics.</p>
            <div className="question-list">
              {followupBank.map((question, index) => (
                <article className="question-card" key={question.id}>
                  <p className="question-title">
                    Follow-up {index + 1}. [{`Unit ${question.unit}`} | {formatSlug(question.topicSlug ?? question.topic)}]{" "}
                    <span style={{ whiteSpace: "pre-wrap" }}>{question.prompt}</span>
                  </p>
                  <p>
                    Correct answer: <strong>{question.options[question.correctOptionIndex]}</strong>
                  </p>
                  <p>{question.explanation}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

/* ── Collapsible Theory Card ─────────────────────────── */

function TheoryCardCollapsible({ theory }: { theory: TheoryContent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="theory-card">
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <h3>
          {theory.topicName} (Unit {theory.unit})
        </h3>
        <span className="btn btn-small btn-ghost">{expanded ? "Collapse" : "Expand"}</span>
      </div>
      {expanded ? (
        <div className="theory-body">
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{theory.summary}</div>
          <h4>Key Points</h4>
          <ul>
            {theory.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <h4>Common Mistakes</h4>
          <ul className="mistakes-list">
            {theory.commonMistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
