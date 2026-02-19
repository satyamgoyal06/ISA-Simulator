"use client";

import AuthGate from "@/components/AuthGate";
import TopBar from "@/components/TopBar";
import { QUESTION_BANK, isValidSubject } from "@/data/questionBank";
import type { MCQQuestion, Subject } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { recordResults } from "@/lib/userProfile";
import Link from "next/link";
import { useMemo, useState } from "react";

type PracticePageProps = {
  params: {
    subject: string;
  };
};

export default function SubjectPracticePage({ params }: PracticePageProps) {
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
      <PracticeRunner subject={params.subject as Subject} />
    </AuthGate>
  );
}

function randomQuestion(pool: MCQQuestion[], excludeId?: string): MCQQuestion {
  const eligible = excludeId ? pool.filter((question) => question.id !== excludeId) : pool;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

function PracticeRunner({ subject }: { subject: Subject }) {
  const pool = useMemo(() => QUESTION_BANK[subject].mcq, [subject]);
  const [question, setQuestion] = useState<MCQQuestion>(() => randomQuestion(pool));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [wrongQuestions, setWrongQuestions] = useState<MCQQuestion[]>([]);
  const [correctQuestions, setCorrectQuestions] = useState<MCQQuestion[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  function submitAnswer() {
    if (selected === null || checked) return;

    setChecked(true);
    const isCorrect = selected === question.correctOptionIndex;
    setStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }));

    if (isCorrect) {
      setCorrectQuestions((prev) => [...prev, question]);
    } else {
      setWrongQuestions((prev) => [...prev, question]);
    }
  }

  function nextQuestion() {
    setQuestion(randomQuestion(pool, question.id));
    setSelected(null);
    setChecked(false);
  }

  async function endSession() {
    // Record to profile
    if (stats.total > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await recordResults(user.id, subject, "practice", correctQuestions, wrongQuestions);
      }
    }
    setSessionEnded(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const answered = stats.total > 0;
  const accuracy = answered ? Math.round((stats.correct / stats.total) * 100) : 0;

  if (sessionEnded) {
    return (
      <main className="page-wrap">
        <section className="card wide-card">
          <TopBar />
          <h1>{subject} Practice — Session Complete</h1>

          <div className="result-box">
            <h2>
              Score: {stats.correct}/{stats.total} ({accuracy}%)
            </h2>
            <p>
              {wrongQuestions.length > 0
                ? `You got ${wrongQuestions.length} question(s) wrong. Review them below.`
                : "Perfect session! No wrong answers."}
            </p>
            <div className="row">
              <Link className="btn" href={`/review/${subject}`}>
                Review Weak Topics
              </Link>
              <Link className="btn btn-secondary" href={`/practice/${subject}`}>
                New Session
              </Link>
              <Link className="btn btn-ghost" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>

          {wrongQuestions.length > 0 ? (
            <section>
              <h2>Wrong Answers</h2>
              <div className="question-list">
                {wrongQuestions.map((q, i) => (
                  <article className="question-card question-wrong" key={q.id}>
                    <p className="question-title">
                      {i + 1}. [{`Unit ${q.unit}`} | {formatSlug(q.topicSlug ?? q.topic)}]{" "}
                      <span style={{ whiteSpace: "pre-wrap" }}>{q.prompt}</span>
                    </p>
                    <p className="ok">
                      Correct answer: <strong>{q.options[q.correctOptionIndex]}</strong>
                    </p>
                    {q.explanation ? <p>{q.explanation}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <section className="card wide-card">
        <TopBar />
        <h1>{subject} Interactive Practice</h1>
        <p>
          Attempted: {stats.total} | Correct: {stats.correct} | Accuracy: {accuracy}%
        </p>

        <article className="question-card">
          <p className="question-title">
            [{`Unit ${question.unit}`} | {formatSlug(question.topicSlug ?? question.topic)}]{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{question.prompt}</span>
          </p>

          <div className="stack">
            {question.options.map((option, optionIndex) => (
              <label className={`option ${selected === optionIndex ? "selected" : ""}`} key={optionIndex}>
                <input
                  type="radio"
                  name={question.id}
                  checked={selected === optionIndex}
                  onChange={() => { if (!checked) setSelected(optionIndex); }}
                  disabled={checked}
                />
                <span style={{ whiteSpace: "pre-wrap" }}>{option}</span>
              </label>
            ))}
          </div>

          {checked ? (
            <p className={selected === question.correctOptionIndex ? "ok" : "error"}>
              {selected === question.correctOptionIndex ? "Correct." : "Incorrect."} {question.explanation}
            </p>
          ) : null}

          <div className="row">
            <button className="btn" type="button" onClick={submitAnswer} disabled={selected === null || checked}>
              Check
            </button>
            <button className="btn btn-secondary" type="button" onClick={nextQuestion}>
              Next Question
            </button>
            {stats.total >= 1 ? (
              <button className="btn btn-ghost" type="button" onClick={endSession}>
                End Session
              </button>
            ) : null}
            <Link className="btn btn-ghost" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
