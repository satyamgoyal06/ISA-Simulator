import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-wrap">
      <section className="card hero-card">
        <p className="kicker">ISA Simulator</p>
        <h1>Master Your Exams with Adaptive Learning</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
          212+ real OS questions, code-based MCQs, personalized weak-topic detection, and iterative practice rounds.
          Track your progress and ace your exams.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link className="btn" href="/signup">
            Get Started
          </Link>
          <Link className="btn btn-secondary" href="/login">
            Login
          </Link>
        </div>
        <div className="row" style={{ justifyContent: "center", gap: "2rem" }}>
          <Stat value="212+" label="Questions" />
          <Stat value="11" label="Topics" />
          <Stat value="5" label="Subjects" />
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent)" }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}
