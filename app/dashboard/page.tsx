"use client";

import AuthGate from "@/components/AuthGate";
import TopBar from "@/components/TopBar";
import { SUBJECTS } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import {
  getOverallAccuracy,
  getWeakTopics,
  getStrongTopics,
  getRecommendations,
  getProgressHistory,
  getTopicAccuracy
} from "@/lib/userProfile";
import type { Subject } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
  accuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  recommendations: string[];
  history: { date: string; score: number; totalQuestions: number }[];
  topicAccuracy: Record<string, { accuracy: number; attempted: number; correct: number }>;
};

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<Partial<Record<Subject, DashboardData>>>({});

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const d: Partial<Record<Subject, DashboardData>> = {};
      for (const subject of SUBJECTS) {
        const [accuracy, weakTopics, strongTopics, recommendations, history, topicAcc] = await Promise.all([
          getOverallAccuracy(user.id, subject),
          getWeakTopics(user.id, subject),
          getStrongTopics(user.id, subject),
          getRecommendations(user.id, subject),
          getProgressHistory(user.id, subject),
          getTopicAccuracy(user.id, subject)
        ]);
        d[subject] = { accuracy, weakTopics, strongTopics, recommendations, history, topicAccuracy: topicAcc };
      }
      setData(d);
    }
    loadData();
  }, []);

  return (
    <main className="page-wrap">
      <section className="card wide-card">
        <TopBar />
        <h1>Dashboard</h1>
        <p>Choose a subject to take a test, practice MCQs, or review weak topics.</p>

        {userId ? <QuickStats data={data} /> : null}

        <div className="subject-grid">
          {SUBJECTS.map((subject) => {
            const sd = data[subject];
            const hasData = sd && sd.history.length > 0;
            const accuracyPct = sd ? Math.round(sd.accuracy * 100) : 0;
            const weakCount = sd?.weakTopics.length ?? 0;

            return (
              <article className="subject-card" key={subject}>
                <div className="row subject-card-header">
                  <h2>{subject}</h2>
                  {hasData ? (
                    <span className={`accuracy-badge ${accuracyPct >= 70 ? "badge-good" : accuracyPct >= 50 ? "badge-ok" : "badge-weak"}`}>
                      {accuracyPct}%
                    </span>
                  ) : null}
                </div>

                {hasData ? (
                  <div className="subject-stats">
                    <p>{sd.history.length} session(s) completed</p>
                    {weakCount > 0 ? (
                      <p className="weak-indicator">⚠ {weakCount} weak topic{weakCount > 1 ? "s" : ""}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="muted-text">No data yet</p>
                )}

                <div className="row">
                  <Link className="btn" href={`/test/${subject}`}>Take Test</Link>
                  <Link className="btn btn-secondary" href={`/practice/${subject}`}>Practice</Link>
                  <Link className="btn btn-ghost" href={`/review/${subject}`}>Review</Link>
                </div>
              </article>
            );
          })}
        </div>

        {userId && data.OS ? <RecommendationsSection subject="OS" sd={data.OS} /> : null}
        {userId && data.OS && Object.keys(data.OS.topicAccuracy).length > 0 ? (
          <TopicBreakdown subject="OS" topicAccuracy={data.OS.topicAccuracy} />
        ) : null}
        {userId && data.OS && data.OS.history.length > 0 ? (
          <ProgressChart history={data.OS.history} subject="OS" />
        ) : null}
      </section>
    </main>
  );
}

function QuickStats({ data }: { data: Partial<Record<Subject, DashboardData>> }) {
  let total = 0;
  let correct = 0;
  let sessions = 0;
  for (const sd of Object.values(data)) {
    if (!sd) continue;
    for (const entry of sd.history) {
      total += entry.totalQuestions;
      correct += entry.score;
      sessions += 1;
    }
  }
  if (sessions === 0) return null;

  return (
    <div className="quick-stats">
      <div className="stat-card">
        <span className="stat-value">{sessions}</span>
        <span className="stat-label">Sessions</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Qs Attempted</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{total > 0 ? Math.round((correct / total) * 100) : 0}%</span>
        <span className="stat-label">Overall Accuracy</span>
      </div>
    </div>
  );
}

function RecommendationsSection({ subject, sd }: { subject: string; sd: DashboardData }) {
  if (sd.recommendations.length === 0) return null;
  return (
    <section className="recs-section">
      <h2>💡 Recommendations — {subject}</h2>
      <ul>{sd.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
    </section>
  );
}

function TopicBreakdown({ subject, topicAccuracy }: { subject: string; topicAccuracy: Record<string, { accuracy: number; attempted: number; correct: number }> }) {
  const sorted = Object.entries(topicAccuracy).sort((a, b) => a[1].accuracy - b[1].accuracy);
  return (
    <section className="topic-breakdown">
      <h2>📊 Topic Breakdown — {subject}</h2>
      <div className="topic-bars">
        {sorted.map(([slug, stats]) => {
          const pct = Math.round(stats.accuracy * 100);
          return (
            <div className="topic-row" key={slug}>
              <span className="topic-name">{formatSlug(slug)}</span>
              <div className="bar-container">
                <div className={`bar-fill ${pct >= 70 ? "bar-good" : pct >= 50 ? "bar-ok" : "bar-weak"}`} style={{ width: `${Math.max(pct, 3)}%` }} />
              </div>
              <span className="topic-pct">{pct}%</span>
              <span className="topic-count">({stats.correct}/{stats.attempted})</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProgressChart({ history, subject }: { history: { date: string; score: number; totalQuestions: number }[]; subject: string }) {
  const lastN = history.slice(-10);
  return (
    <section className="progress-section">
      <h2>📈 Progress — {subject}</h2>
      <div className="chart-container">
        {lastN.map((entry, i) => {
          const pct = Math.round((entry.score / entry.totalQuestions) * 100);
          return (
            <div className="chart-bar-wrap" key={i}>
              <div className="chart-bar" style={{ height: `${Math.max(pct, 5)}%` }}>
                <span className="chart-label">{pct}%</span>
              </div>
              <span className="chart-date">
                {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatSlug(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
