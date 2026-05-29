"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    window.location.href = "/app";
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Sign in</p>
        <h1 style={{ margin: "8px 0 18px", letterSpacing: "-0.04em" }}>Day Anchor 로그인</h1>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p style={{ color: "#b45309", margin: 0 }}>{error}</p>}
          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
        <p style={{ marginTop: 16, color: "var(--muted)" }}>
          계정이 없나요? <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
