"use client";

import AuthGate from "@/components/AuthGate";
import TopBar from "@/components/TopBar";
import { QUESTION_BANK, isValidSubject } from "@/data/questionBank";
import { OS_THEORY } from "@/data/osTheory";
import { buildTargetedMcqSet } from "@/lib/testEngine";
import { getCurrentUser } from "@/lib/auth";
import { recordResults, getWeakTopics } from "@/lib/userProfile";
import type { MCQQuestion, Subject, TheoryContent } from "@/lib/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReviewPageProps = {
    params: {
        subject: string;
    };
};

export default function ReviewPage({ params }: ReviewPageProps) {
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
            <ReviewRunner subject={params.subject as Subject} />
        </AuthGate>
    );
}

function ReviewRunner({ subject }: { subject: Subject }) {
    const bank = QUESTION_BANK[subject];
    const [userId, setUserId] = useState<string | null>(null);
    const [weakTopicSlugs, setWeakTopicSlugs] = useState<string[]>([]);
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
    const [submitted, setSubmitted] = useState(false);
    const [round, setRound] = useState(1);
    const [showTheory, setShowTheory] = useState(true);
    const [excludeIds, setExcludeIds] = useState<string[]>([]);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) return;
        setUserId(user.id);
        const weak = getWeakTopics(user.id, subject);
        setWeakTopicSlugs(weak.length > 0 ? weak : getAllTopicSlugs(subject));
        const qs = buildTargetedMcqSet({
            allMcqQuestions: bank.mcq,
            weakTopicSlugs: weak.length > 0 ? weak : getAllTopicSlugs(subject),
            totalQuestions: 10
        });
        setQuestions(qs);
        setExcludeIds(qs.map((q) => q.id));
    }, [subject, bank.mcq]);

    const theoryForWeakTopics = useMemo(() => {
        if (subject !== "OS") return [];
        return OS_THEORY.filter((t) => weakTopicSlugs.includes(t.topicSlug));
    }, [subject, weakTopicSlugs]);

    function onSelect(questionId: string, optionIndex: number) {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    }

    function onSubmit() {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        if (!userId) return;

        const correct = questions.filter((q) => answers[q.id] === q.correctOptionIndex);
        const wrong = questions.filter((q) => answers[q.id] !== q.correctOptionIndex);
        recordResults(userId, subject, "review", correct, wrong);

        const newWeak = getWeakTopics(userId, subject);
        setWeakTopicSlugs(newWeak.length > 0 ? newWeak : getAllTopicSlugs(subject));
    }

    function onNextRound() {
        const newQs = buildTargetedMcqSet({
            allMcqQuestions: bank.mcq,
            weakTopicSlugs: weakTopicSlugs,
            excludeQuestionIds: excludeIds,
            totalQuestions: 10
        });
        setQuestions(newQs);
        setExcludeIds((prev) => [...prev, ...newQs.map((q) => q.id)]);
        setAnswers({});
        setSubmitted(false);
        setRound((r) => r + 1);
        setShowTheory(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const correctCount = submitted ? questions.filter((q) => answers[q.id] === q.correctOptionIndex).length : 0;

    return (
        <main className="page-wrap">
            <section className="card wide-card">
                <TopBar />
                <h1>{subject} — Review & Strengthen (Round {round})</h1>

                {weakTopicSlugs.length > 0 ? (
                    <div className="weak-topics-banner">
                        <p>
                            <strong>Focus areas:</strong> {weakTopicSlugs.map(formatSlug).join(", ")}
                        </p>
                    </div>
                ) : null}

                {/* Theory Section */}
                {showTheory && theoryForWeakTopics.length > 0 ? (
                    <section className="theory-section">
                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                            <h2>📖 Study Material</h2>
                            <button className="btn btn-small btn-secondary" type="button" onClick={() => setShowTheory(false)}>
                                Hide Theory
                            </button>
                        </div>
                        {theoryForWeakTopics.map((theory) => (
                            <TheoryCard key={theory.topicSlug} theory={theory} />
                        ))}
                    </section>
                ) : theoryForWeakTopics.length > 0 ? (
                    <button className="btn btn-small btn-secondary" type="button" onClick={() => setShowTheory(true)}>
                        Show Study Material
                    </button>
                ) : null}

                {/* MCQ Section */}
                {submitted ? (
                    <div className="result-box">
                        <h2>
                            Round {round} Score: {correctCount}/{questions.length}
                        </h2>
                        <p>Wrong answers are highlighted below. Review them and try another round!</p>
                        <div className="row">
                            <button className="btn" type="button" onClick={onNextRound}>
                                Next Round (10 more questions)
                            </button>
                            <Link className="btn btn-secondary" href="/dashboard">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                ) : null}

                <div className="question-list">
                    {questions.map((question, index) => {
                        const isWrong = submitted && answers[question.id] !== question.correctOptionIndex;
                        return (
                            <article className={`question-card ${isWrong ? "question-wrong" : ""}`} key={question.id}>
                                <p className="question-title">
                                    Q{index + 1}. [{`Unit ${question.unit}`} | {formatSlug(question.topicSlug ?? question.topic)}]{" "}
                                    <span style={{ whiteSpace: "pre-wrap" }}>{question.prompt}</span>
                                </p>
                                <div className="stack">
                                    {question.options.map((option, optionIndex) => {
                                        const checked = answers[question.id] === optionIndex;
                                        return (
                                            <label className={`option ${checked ? "selected" : ""}`} key={optionIndex}>
                                                <input
                                                    type="radio"
                                                    name={question.id}
                                                    checked={checked}
                                                    onChange={() => onSelect(question.id, optionIndex)}
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
                                        {question.explanation ? ` — ${question.explanation}` : ""}
                                    </p>
                                ) : null}
                            </article>
                        );
                    })}
                </div>

                {!submitted ? (
                    <button className="btn" type="button" onClick={onSubmit}>
                        Submit Answers
                    </button>
                ) : null}
            </section>
        </main>
    );
}

/* ── Theory Card Component ───────────────────────────── */

function TheoryCard({ theory }: { theory: TheoryContent }) {
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

/* ── Helpers ──────────────────────────────────────────── */

function formatSlug(slug: string): string {
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function getAllTopicSlugs(subject: Subject): string[] {
    if (subject === "OS") {
        return [
            "os-fundamentals",
            "interrupts-io",
            "memory-storage",
            "multiprocessing",
            "os-services",
            "computing-environments",
            "processes",
            "ipc",
            "threads",
            "synchronization",
            "deadlocks"
        ];
    }
    return [];
}
