"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signup } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    const result = signup({ name, email, password });

    if (!result.ok) {
      setError(result.message);
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
            <input type="password" name="password" />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit">
            Sign up
          </button>
        </form>
        <p>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
