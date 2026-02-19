"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      setError("All fields are required.");
      return;
    }

    const result = login({ email, password });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="page-wrap">
      <section className="card form-card">
        <h1>Login</h1>
        <form onSubmit={onSubmit} className="stack">
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
            Login
          </button>
        </form>
        <p>
          No account yet? <Link href="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
