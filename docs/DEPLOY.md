# Vercel 배포 가이드 (5분)

GitHub 저장소가 준비되었습니다: https://github.com/BANSEOK-KANG1/day-anchor

## 1. Vercel에 연결

1. https://vercel.com/new/import?repository-url=https://github.com/BANSEOK-KANG1/day-anchor 접속
2. GitHub 계정으로 로그인 (아직이면 연결)
3. `BANSEOK-KANG1/day-anchor` 저장소 선택 → **Import**

## 2. 프로젝트 설정

Vercel이 자동으로 Next.js를 감지합니다. 아래만 확인하세요.

| 항목 | 값 |
|------|-----|
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | (기본값) |

## 3. 환경변수 (Supabase 연결 후)

Supabase 프로젝트를 만들면 Vercel → Project → Settings → Environment Variables에 추가:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Supabase 없이도 배포는 가능하지만, 로그인/동기화는 동작하지 않습니다.

## 4. Deploy

**Deploy** 클릭 → 1~2분 후 Live URL 생성 (예: `https://day-anchor.vercel.app`)

## 5. PWA 설치

Live URL(HTTPS)에서:

- **iPhone:** Safari → 공유 → 홈 화면에 추가
- **Android:** Chrome → 앱 설치
- **PC:** Chrome/Edge 주소창 설치 아이콘

## 6. Supabase 나중에 연결할 때

1. [docs/SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 따라 Supabase 프로젝트 + 스키마 생성
2. Vercel 환경변수 2개 추가
3. Vercel → Deployments → **Redeploy**

## CLI로 배포 (선택)

```bash
npx vercel login
npx vercel --prod
```
