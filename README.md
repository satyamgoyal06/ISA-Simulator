# ISA Simulator (Initial Build)

Vercel-ready Next.js scaffold for your exam platform.

## Features in this version
- Simple email/password sign-up and login (prototype via `localStorage`)
- 5 subjects: `OS`, `MPCA`, `CN`, `LA`, `DAA`
- Test mode per subject:
  - `24` balanced MCQs (Unit 1 + Unit 2)
  - `4` subjective questions
  - `1 hour` timer with auto-submit
  - no negative marking
  - section switching (MCQ/subjective) allowed
  - score report with wrong questions highlighted
- Post-submit remediation:
  - 10-question follow-up bank focused on weak topics
  - AI-generated topic explanation for wrong areas
- Practice mode: interactive one-question-at-a-time MCQ flow

## Run locally
```bash
npm install
npm run dev
```

## Deploy on Vercel
1. Push this repository to GitHub.
2. Import it in Vercel.
3. Add env var `OPENAI_API_KEY` (optional; fallback explanation works without it).
4. Deploy.

## Integrating your question docs
Replace placeholder generators in `/data/questionBank.ts` with parsed data from your DOCX files (MCQ + answers + subjective bank).
