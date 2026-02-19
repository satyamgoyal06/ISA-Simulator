import { NextResponse } from "next/server";

type ExplainRequest = {
  subject: string;
  weakTopics: string[];
};

function fallbackExplanation(subject: string, weakTopics: string[]): string {
  if (weakTopics.length === 0) {
    return `Your ${subject} attempt shows no clear weak areas.`;
  }

  return `Focus revision on ${weakTopics.join(", ")} in ${subject}. For each topic, revise definitions, solve 3-5 examples, and summarize trade-offs in one short note.`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExplainRequest;
    const subject = body.subject;
    const weakTopics = Array.isArray(body.weakTopics) ? body.weakTopics : [];

    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ explanation: fallbackExplanation(subject, weakTopics) });
    }

    const prompt = `Create a concise study explanation for a student in ${subject}. Weak topics: ${
      weakTopics.join(", ") || "general revision"
    }. Include: (1) plain-language concept refresh, (2) common mistakes, (3) a short 5-step revision plan.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    if (!response.ok) {
      return NextResponse.json({ explanation: fallbackExplanation(subject, weakTopics) });
    }

    const data = (await response.json()) as {
      output_text?: string;
    };

    return NextResponse.json({
      explanation: data.output_text || fallbackExplanation(subject, weakTopics)
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate explanation." }, { status: 500 });
  }
}
