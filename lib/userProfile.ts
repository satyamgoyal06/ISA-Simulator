import type {
    MCQQuestion,
    Subject,
    SubjectProfile,
    TestHistoryEntry,
    TopicStats,
    UserProfile
} from "@/lib/types";

const PROFILE_KEY = "isa_user_profiles";

/* ── Persistence ──────────────────────────────────────── */

function readAllProfiles(): Record<string, UserProfile> {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw) as Record<string, UserProfile>;
    } catch {
        return {};
    }
}

function writeAllProfiles(profiles: Record<string, UserProfile>) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

/* ── Public API ───────────────────────────────────────── */

export function getProfile(userId: string): UserProfile {
    const all = readAllProfiles();
    if (all[userId]) return all[userId];
    return { userId, subjectStats: {} };
}

export function saveProfile(profile: UserProfile) {
    const all = readAllProfiles();
    all[profile.userId] = profile;
    writeAllProfiles(all);
}

function ensureSubjectProfile(profile: UserProfile, subject: Subject): SubjectProfile {
    if (!profile.subjectStats[subject]) {
        profile.subjectStats[subject] = {
            testsCompleted: 0,
            practiceSessionsCompleted: 0,
            topicStats: {},
            history: []
        };
    }
    return profile.subjectStats[subject]!;
}

function ensureTopicStats(sp: SubjectProfile, topicSlug: string): TopicStats {
    if (!sp.topicStats[topicSlug]) {
        sp.topicStats[topicSlug] = {
            topicSlug,
            totalAttempted: 0,
            totalCorrect: 0,
            recentWrongIds: [],
            lastAttemptedAt: new Date().toISOString()
        };
    }
    return sp.topicStats[topicSlug];
}

/* ── Record Results ───────────────────────────────────── */

export function recordResults(
    userId: string,
    subject: Subject,
    mode: "test" | "practice" | "review",
    correctQuestions: MCQQuestion[],
    wrongQuestions: MCQQuestion[]
) {
    const profile = getProfile(userId);
    const sp = ensureSubjectProfile(profile, subject);

    if (mode === "test") sp.testsCompleted += 1;
    if (mode === "practice") sp.practiceSessionsCompleted += 1;

    const allQuestions = [...correctQuestions, ...wrongQuestions];
    const wrongIds = new Set(wrongQuestions.map((q) => q.id));

    // Update per-topic stats
    for (const q of allQuestions) {
        const slug = q.topicSlug ?? q.topic;
        const ts = ensureTopicStats(sp, slug);
        ts.totalAttempted += 1;
        if (!wrongIds.has(q.id)) {
            ts.totalCorrect += 1;
        } else {
            ts.recentWrongIds = [q.id, ...ts.recentWrongIds].slice(0, 20);
        }
        ts.lastAttemptedAt = new Date().toISOString();
    }

    // Append history entry
    const weakTopics = getWeakTopicsFromProfile(sp);
    const entry: TestHistoryEntry = {
        date: new Date().toISOString(),
        score: correctQuestions.length,
        totalQuestions: allQuestions.length,
        weakTopics,
        mode
    };
    sp.history.push(entry);

    saveProfile(profile);
    return profile;
}

/* ── Analytics ────────────────────────────────────────── */

function getWeakTopicsFromProfile(sp: SubjectProfile, threshold = 0.6): string[] {
    const weak: string[] = [];
    for (const [slug, ts] of Object.entries(sp.topicStats)) {
        if (ts.totalAttempted >= 3) {
            const accuracy = ts.totalCorrect / ts.totalAttempted;
            if (accuracy < threshold) {
                weak.push(slug);
            }
        }
    }
    return weak;
}

export function getWeakTopics(userId: string, subject: Subject, threshold = 0.6): string[] {
    const profile = getProfile(userId);
    const sp = profile.subjectStats[subject];
    if (!sp) return [];
    return getWeakTopicsFromProfile(sp, threshold);
}

export function getStrongTopics(userId: string, subject: Subject, threshold = 0.8): string[] {
    const profile = getProfile(userId);
    const sp = profile.subjectStats[subject];
    if (!sp) return [];
    const strong: string[] = [];
    for (const [slug, ts] of Object.entries(sp.topicStats)) {
        if (ts.totalAttempted >= 3) {
            const accuracy = ts.totalCorrect / ts.totalAttempted;
            if (accuracy >= threshold) {
                strong.push(slug);
            }
        }
    }
    return strong;
}

export function getTopicAccuracy(userId: string, subject: Subject): Record<string, { accuracy: number; attempted: number; correct: number }> {
    const profile = getProfile(userId);
    const sp = profile.subjectStats[subject];
    if (!sp) return {};
    const result: Record<string, { accuracy: number; attempted: number; correct: number }> = {};
    for (const [slug, ts] of Object.entries(sp.topicStats)) {
        result[slug] = {
            accuracy: ts.totalAttempted > 0 ? ts.totalCorrect / ts.totalAttempted : 0,
            attempted: ts.totalAttempted,
            correct: ts.totalCorrect
        };
    }
    return result;
}

export function getOverallAccuracy(userId: string, subject: Subject): number {
    const profile = getProfile(userId);
    const sp = profile.subjectStats[subject];
    if (!sp) return 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    for (const ts of Object.values(sp.topicStats)) {
        totalAttempted += ts.totalAttempted;
        totalCorrect += ts.totalCorrect;
    }
    return totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
}

export function getProgressHistory(userId: string, subject: Subject): TestHistoryEntry[] {
    const profile = getProfile(userId);
    const sp = profile.subjectStats[subject];
    if (!sp) return [];
    return sp.history;
}

export function getRecommendations(userId: string, subject: Subject): string[] {
    const profile = getProfile(userId);
    const sp = profile.subjectStats[subject];
    if (!sp) return ["Take your first test to get personalized recommendations."];

    const recs: string[] = [];
    const weakTopics = getWeakTopicsFromProfile(sp);
    const strongTopics: string[] = [];
    const improving: string[] = [];

    for (const [slug, ts] of Object.entries(sp.topicStats)) {
        const accuracy = ts.totalAttempted > 0 ? ts.totalCorrect / ts.totalAttempted : 0;
        if (accuracy >= 0.8 && ts.totalAttempted >= 5) {
            strongTopics.push(slug);
        }
    }

    // Check for improvement trends in history
    if (sp.history.length >= 2) {
        const recent = sp.history.slice(-3);
        const older = sp.history.slice(-6, -3);
        if (recent.length > 0 && older.length > 0) {
            const recentAvg = recent.reduce((s, e) => s + e.score / e.totalQuestions, 0) / recent.length;
            const olderAvg = older.reduce((s, e) => s + e.score / e.totalQuestions, 0) / older.length;
            if (recentAvg > olderAvg + 0.05) {
                improving.push("overall");
            }
        }
    }

    if (weakTopics.length > 0) {
        const topicNames = weakTopics.map((t) => formatTopicName(t));
        recs.push(`Focus on: ${topicNames.join(", ")} — these are below 60% accuracy.`);
    }

    if (strongTopics.length > 0) {
        recs.push(`Great work on: ${strongTopics.map((t) => formatTopicName(t)).join(", ")} — keep it up!`);
    }

    if (improving.length > 0) {
        recs.push("Your recent scores are improving — maintaining consistency will solidify your understanding.");
    }

    if (sp.testsCompleted === 0) {
        recs.push("Take a full test to get a comprehensive assessment of your knowledge.");
    } else if (sp.testsCompleted < 3) {
        recs.push(`You've taken ${sp.testsCompleted} test(s). Take more tests to build a reliable profile.`);
    }

    if (recs.length === 0) {
        recs.push("Keep practicing to maintain your performance!");
    }

    return recs;
}

function formatTopicName(slug: string): string {
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
