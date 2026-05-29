import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";

export default function HomePage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="landing-shell">
      <div className="landing-card">
        <p className="eyebrow">Day Anchor</p>
        <h1>달력 중심으로 하루를 운영하세요.</h1>
        <p>
          일정, 체크리스트, 텍스트/음성 메모, 하루 회고를 하나의 보드로 통합하고 Supabase로
          폰과 컴퓨터에서 동기화합니다.
        </p>
        {!configured && (
          <p style={{ marginTop: 16, color: "#b45309" }}>
            Supabase 환경변수가 아직 설정되지 않았습니다. `.env.local`에 URL과 anon key를
            추가한 뒤 `supabase/schema.sql`을 실행해주세요.
          </p>
        )}
        <div className="landing-actions">
          <Link href="/login" className="primary-btn">
            로그인
          </Link>
          <Link href="/signup" className="secondary-btn">
            회원가입
          </Link>
          <Link href="/app" className="ghost-btn">
            앱 열기
          </Link>
        </div>
      </div>
    </div>
  );
}
