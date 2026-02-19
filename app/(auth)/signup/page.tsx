"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signUp } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!name || !email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    const result = await signUp(name, email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="page-wrap">
      <section className="card form-card">
        <h1>Create account</h1>
        <form onSubmit={onSubmit} className="stack">
          <label>
            Name
            <input type="text" name="name" />
          </label>
          <label>
            Email
            <input type="email" name="email" />
          </label>
          <label>
            Password
            <input type="password" name="password" minLength={6} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
