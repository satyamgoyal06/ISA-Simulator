import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-wrap home-page">
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="card hero-card">
        <p className="kicker">ISA Simulator</p>
        <h1>Master Your Exams with Adaptive Learning</h1>
        <p className="hero-desc">
          212+ real OS questions · Code-based MCQs · Personalized weak-topic detection · Iterative practice rounds ·
          Track your progress and ace your exams.
        </p>
        <div className="row hero-buttons">
          <Link className="btn" href="/signup">
            Get Started
          </Link>
          <Link className="btn btn-secondary" href="/login">
            Login
          </Link>
          <a
            className="btn btn-ghost"
            href="https://github.com/satyamgoyal06/ISA-Simulator"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⭐ GitHub
          </a>
        </div>
        <div className="row hero-stats">
          <HeroStat value="212+" label="Questions" />
          <HeroStat value="30" label="Code MCQs" />
          <HeroStat value="11" label="Topics" />
          <HeroStat value="5" label="Subjects" />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section className="card info-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          <StepCard number="01" title="Take a Test" desc="24 MCQs balanced across units & topics + 4 subjective questions, 1-hour timer. Simulates real exam conditions." />
          <StepCard number="02" title="Identify Weak Areas" desc="Our engine analyses your wrong answers and maps them to specific topic areas like Deadlocks, IPC, or Synchronization." />
          <StepCard number="03" title="Study Theory" desc="Get focused study material for your weak topics — key points, summaries, and common mistakes to avoid." />
          <StepCard number="04" title="Practice & Improve" desc="10 targeted MCQs on your weak areas. After each round, your profile updates and new questions are served." />
        </div>
      </section>

      {/* ── Tech & Algorithms ─────────────────────────── */}
      <section className="card info-section">
        <h2 className="section-title">Technologies & Algorithms</h2>
        <div className="tech-grid">
          <TechCard
            icon="⚡"
            title="Topic-Balanced Selection"
            desc="Round-robin algorithm distributes questions evenly across all topics within each unit, ensuring comprehensive exam coverage."
          />
          <TechCard
            icon="🧠"
            title="Adaptive Learning Engine"
            desc="Tracks per-topic accuracy with a 60% threshold to detect weak areas. Iteratively serves targeted questions until mastery is achieved."
          />
          <TechCard
            icon="📊"
            title="User Profiling System"
            desc="Persistent localStorage profiles track accuracy, history, and progress per topic. Generates personalized recommendations."
          />
          <TechCard
            icon="🤖"
            title="AI Explanations"
            desc="OpenAI-powered topic explanations for weak areas after each test, with intelligent fallback when API is unavailable."
          />
          <TechCard
            icon="⚛️"
            title="Next.js 14 + React"
            desc="Server-side rendering, dynamic routing, and optimized production builds. Built with TypeScript for full type safety."
          />
          <TechCard
            icon="🎨"
            title="Modern UI Design"
            desc="Dark purple-black theme with glassmorphism, gradient text, glowing micro-interactions, and responsive layouts."
          />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="card info-section">
        <h2 className="section-title">Platform Features</h2>
        <div className="features-grid">
          <FeatureItem icon="📝" text="182 real OS MCQs from university source material" />
          <FeatureItem icon="💻" text="30 code-based MCQs — fork(), pipes, semaphores, pthreads" />
          <FeatureItem icon="📖" text="11 theory modules with key points & common mistakes" />
          <FeatureItem icon="📈" text="Progress charts and accuracy tracking over time" />
          <FeatureItem icon="🎯" text="Weak-topic detection with < 60% accuracy threshold" />
          <FeatureItem icon="🔄" text="Iterative review rounds — theory → practice → re-evaluate" />
          <FeatureItem icon="⏱️" text="Timed tests simulating real exam conditions (60 min)" />
          <FeatureItem icon="💡" text="AI-generated study recommendations per topic" />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="site-footer">
        <a
          href="https://github.com/satyamgoyal06/ISA-Simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github"
        >
          GitHub Repository
        </a>
        <p className="footer-credit">Made by Satyam Goyal</p>
      </footer>
    </main>
  );
}

/* ── Sub-components ───────────────────────────────────── */

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="hero-stat">
      <span className="hero-stat-value">{value}</span>
      <span className="hero-stat-label">{label}</span>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="step-card">
      <span className="step-number">{number}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function TechCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="tech-card">
      <span className="tech-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="feature-item">
      <span className="feature-icon">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
