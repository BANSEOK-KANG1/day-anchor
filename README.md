# Day Anchor

큰 월간 달력을 중심으로 일정, 체크리스트, 텍스트/음성 메모, 하루 회고를 관리하는 **Next.js + Supabase PWA**입니다.

폰과 컴퓨터에서 로그인 후 같은 데이터를 실시간으로 동기화할 수 있습니다.

## Live Demo

- **GitHub:** https://github.com/BANSEOK-KANG1/day-anchor
- **Vercel:** 배포 진행 중 (아래 Vercel 연결 안내 참고)

## 기술 스택

- **Frontend:** Next.js 15 (App Router), TypeScript, React 19
- **Styling:** CSS variables (프로토타입 UI 이식)
- **Backend:** Supabase Auth, Postgres, Storage, Realtime
- **PWA:** `@ducanh2912/next-pwa`
- **Deploy:** Vercel

## 주요 기능

- 월간 달력 기반 날짜 선택 및 요약
- 일정 블록 CRUD (예정/진행/완료/미룸)
- 체크리스트 및 내일로 넘기기
- 텍스트/음성 메모 (Storage 업로드)
- 하루 회고 및 7일 인사이트
- Supabase Realtime 기기 간 동기화
- PWA 홈화면 설치

## 프로젝트 구조

```text
day-anchor/
├── src/
│   ├── app/              # Next.js pages (/, /app, /login, /settings)
│   ├── components/       # UI views & shared components
│   ├── contexts/         # App state + Supabase sync
│   └── lib/              # date utils, stats, Supabase API
├── prototype/            # 1차 vanilla PWA 프로토타입 (보존)
├── supabase/schema.sql   # DB + Storage + Realtime 스키마
├── docs/                 # PRD, Supabase 설정 가이드
└── public/               # PWA manifest, icons
```

## 로컬 개발

### 1. Supabase 설정

[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) 참고.

```bash
cp .env.example .env.local
# .env.local에 Supabase URL/anon key 입력
```

### 2. 스키마 적용

Supabase SQL Editor에서 `supabase/schema.sql` 실행.

### 3. 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` → 회원가입 → 앱 사용.

### 4. 프로토타입 (비교용)

```bash
cd prototype
npx serve .
```

## Vercel 배포

1. GitHub에 push
2. [vercel.com](https://vercel.com) → Import Project
3. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## PWA 설치

HTTPS URL에서:

- **iPhone:** Safari → 공유 → 홈 화면에 추가
- **Android:** Chrome → 앱 설치
- **Desktop:** Chrome/Edge → Install app

## 프로토타입 → 프로덕션

| Before (prototype/) | After (src/) |
|---------------------|--------------|
| localStorage | Supabase Postgres |
| IndexedDB 음성 | Supabase Storage |
| 기기별 분리 | Realtime 동기화 |
| 정적 HTML/JS | Next.js + TypeScript |

## 포트폴리오 설명

> Day Anchor는 개인의 하루 계획, 시간 블록, 체크리스트, 텍스트/음성 메모를 하나의 데일리 보드로 통합한 생산성 PWA입니다. vanilla 프로토타입에서 Next.js + Supabase로 전환하여 계획-실행-회고 흐름을 데이터 구조로 모델링하고, 다기기 동기화와 PWA 설치를 지원합니다.

## 문서

- [docs/PRD.md](docs/PRD.md) — 제품 요구사항
- [docs/TRACKING_PLAN.md](docs/TRACKING_PLAN.md) — 이벤트/지표
- [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) — 백엔드 설정

## 라이선스

Private / Portfolio use
