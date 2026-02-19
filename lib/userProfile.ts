import { supabase } from "@/lib/supabaseClient";
import type { MCQQuestion, Subject } from "@/lib/types";

/* ── Record Results ───────────────────────────────────── */

export async function recordResults(
    userId: string,
    subject: Subject,
    mode: "test" | "practice" | "review",
    correctQuestions: MCQQuestion[],
    wrongQuestions: MCQQuestion[]
) {
    const allQuestions = [...correctQuestions, ...wrongQuestions];
    const wrongIds = new Set(wrongQuestions.map((q) => q.id));

    // Update session counts
    if (mode === "test") {
        // Increment tests_completed
        const { data: profile } = await supabase.from("user_profiles").select("tests_completed").eq("id", userId).single();
        if (profile) {
            await supabase.from("user_profiles").update({ tests_completed: (profile.tests_completed ?? 0) + 1 }).eq("id", userId);
        }
    }

    if (mode === "practice") {
        const { data: profile } = await supabase.from("user_profiles").select("practice_sessions").eq("id", userId).single();
        if (profile) {
            await supabase.from("user_profiles").update({ practice_sessions: (profile.practice_sessions ?? 0) + 1 }).eq("id", userId);
        }
    }

    // Upsert per-topic stats
    for (const q of allQuestions) {
        const slug = q.topicSlug ?? q.topic;
        const isCorrect = !wrongIds.has(q.id);

        // Fetch existing
        const { data: existing } = await supabase
            .from("topic_stats")
            .select("*")
            .eq("user_id", userId)
            .eq("subject", subject)
            .eq("topic_slug", slug)
            .maybeSingle();

        if (existing) {
            const recentWrong = isCorrect
                ? existing.recent_wrong_ids ?? []
                : [q.id, ...(existing.recent_wrong_ids ?? [])].slice(0, 20);

            await supabase
                .from("topic_stats")
                .update({
                    total_attempted: (existing.total_attempted ?? 0) + 1,
                    total_correct: (existing.total_correct ?? 0) + (isCorrect ? 1 : 0),
                    recent_wrong_ids: recentWrong,
                    last_attempted_at: new Date().toISOString()
                })
                .eq("id", existing.id);
        } else {
            await supabase.from("topic_stats").insert({
                user_id: userId,
                subject,
                topic_slug: slug,
                total_attempted: 1,
                total_correct: isCorrect ? 1 : 0,
                recent_wrong_ids: isCorrect ? [] : [q.id],
                last_attempted_at: new Date().toISOString()
            });
        }
    }

    // Insert history entry
    const weakTopics = await getWeakTopics(userId, subject);
    await supabase.from("test_history").insert({
        user_id: userId,
        subject,
        mode,
        score: correctQuestions.length,
        total_questions: allQuestions.length,
        weak_topics: weakTopics
    });
}

/* ── Analytics ────────────────────────────────────────── */

export async function getWeakTopics(userId: string, subject: Subject, threshold = 0.6): Promise<string[]> {
    const { data } = await supabase
        .from("topic_stats")
        .select("topic_slug, total_attempted, total_correct")
        .eq("user_id", userId)
        .eq("subject", subject);

    if (!data) return [];

    return data
        .filter((ts) => ts.total_attempted >= 3 && ts.total_correct / ts.total_attempted < threshold)
        .map((ts) => ts.topic_slug);
}

export async function getStrongTopics(userId: string, subject: Subject, threshold = 0.8): Promise<string[]> {
    const { data } = await supabase
        .from("topic_stats")
        .select("topic_slug, total_attempted, total_correct")
        .eq("user_id", userId)
        .eq("subject", subject);

    if (!data) return [];

    return data
        .filter((ts) => ts.total_attempted >= 3 && ts.total_correct / ts.total_attempted >= threshold)
        .map((ts) => ts.topic_slug);
}

export async function getTopicAccuracy(
    userId: string,
    subject: Subject
): Promise<Record<string, { accuracy: number; attempted: number; correct: number }>> {
    const { data } = await supabase
        .from("topic_stats")
        .select("topic_slug, total_attempted, total_correct")
        .eq("user_id", userId)
        .eq("subject", subject);

    if (!data) return {};

    const result: Record<string, { accuracy: number; attempted: number; correct: number }> = {};
    for (const ts of data) {
        result[ts.topic_slug] = {
            accuracy: ts.total_attempted > 0 ? ts.total_correct / ts.total_attempted : 0,
            attempted: ts.total_attempted,
            correct: ts.total_correct
        };
    }
    return result;
}

export async function getOverallAccuracy(userId: string, subject: Subject): Promise<number> {
    const { data } = await supabase
        .from("topic_stats")
        .select("total_attempted, total_correct")
        .eq("user_id", userId)
        .eq("subject", subject);

    if (!data) return 0;

    let totalAttempted = 0;
    let totalCorrect = 0;
    for (const ts of data) {
        totalAttempted += ts.total_attempted;
        totalCorrect += ts.total_correct;
    }
    return totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
}

export async function getProgressHistory(
    userId: string,
    subject: Subject
): Promise<{ date: string; score: number; totalQuestions: number; mode: string }[]> {
    const { data } = await supabase
        .from("test_history")
        .select("created_at, score, total_questions, mode")
        .eq("user_id", userId)
        .eq("subject", subject)
        .order("created_at", { ascending: true });

    if (!data) return [];

    return data.map((row) => ({
        date: row.created_at,
        score: row.score,
        totalQuestions: row.total_questions,
        mode: row.mode
    }));
}

export async function getRecommendations(userId: string, subject: Subject): Promise<string[]> {
    const [weakTopics, strongTopics, history] = await Promise.all([
        getWeakTopics(userId, subject),
        getStrongTopics(userId, subject),
        getProgressHistory(userId, subject)
    ]);

    const recs: string[] = [];

    if (weakTopics.length > 0) {
        recs.push(`Focus on: ${weakTopics.map(formatTopicName).join(", ")} — these are below 60% accuracy.`);
    }

    if (strongTopics.length > 0) {
        recs.push(`Great work on: ${strongTopics.map(formatTopicName).join(", ")} — keep it up!`);
    }

    // Check improvement
    if (history.length >= 6) {
        const recent = history.slice(-3);
        const older = history.slice(-6, -3);
        const recentAvg = recent.reduce((s, e) => s + e.score / e.totalQuestions, 0) / recent.length;
        const olderAvg = older.reduce((s, e) => s + e.score / e.totalQuestions, 0) / older.length;
        if (recentAvg > olderAvg + 0.05) {
            recs.push("Your recent scores are improving — maintaining consistency will solidify your understanding.");
        }
    }

    const testCount = history.filter((h) => h.mode === "test").length;
    if (testCount === 0) {
        recs.push("Take a full test to get a comprehensive assessment of your knowledge.");
    } else if (testCount < 3) {
        recs.push(`You've taken ${testCount} test(s). Take more tests to build a reliable profile.`);
    }

    if (recs.length === 0) {
        recs.push("Keep practicing to maintain your performance!");
    }

    return recs;
}

function formatTopicName(slug: string): string {
    return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
