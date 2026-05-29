"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const { error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setMessage("가입 완료! 이메일 확인 후 로그인하거나 바로 로그인해보세요.");
    setLoading(false);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Sign up</p>
        <h1 style={{ margin: "8px 0 18px", letterSpacing: "-0.04em" }}>Day Anchor 회원가입</h1>
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
            비밀번호 (6자 이상)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          {error && <p style={{ color: "#b45309", margin: 0 }}>{error}</p>}
          {message && <p style={{ color: "#166534", margin: 0 }}>{message}</p>}
          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>
        <p style={{ marginTop: 16, color: "var(--muted)" }}>
          이미 계정이 있나요? <Link href="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
