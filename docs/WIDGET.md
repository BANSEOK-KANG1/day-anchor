# Day Anchor 홈 화면 위젯

## 1. 웹 위젯 (지금 바로 사용)

1. 앱 로그인 → **더보기** → **홈 화면 위젯**
2. **위젯 키 발급** → **위젯 화면 URL** 복사
3. Android: Chrome에서 URL 북마크 → 홈 화면에 추가  
   또는 PWA 아이콘 **길게 누르기** → 「위젯 설정」「오늘 일정」 바로가기

위젯 URL 예: `https://day-anchor.vercel.app/widget?token=...`

5분마다 자동 새로고침됩니다.

## 2. Supabase 설정 (최초 1회)

Supabase SQL Editor에서 `supabase/schema.sql` 전체를 다시 실행하거나,  
`widget_tokens` 테이블과 `get_widget_snapshot` 함수 부분만 실행하세요.

## 3. API (Android 네이티브 위젯용)

```
GET /api/widget/today?token={위젯키}
```

응답 예:

```json
{
  "date": "2026-06-01",
  "completion": 40,
  "blocks": [{ "id": "...", "title": "...", "start": "09:00", "end": "10:00", "status": "planned" }],
  "tasks": [{ "id": "...", "title": "...", "status": "todo" }],
  "current": { "title": "...", "start": "09:00", "end": "10:00" }
}
```

## 4. Android 네이티브 위젯 (선택)

`android/` 폴더는 **샘플 스켈레ton**입니다. Android Studio에서 열고 `WIDGET_API_URL`에  
발급받은 API URL을 넣은 뒤 빌드하세요. 자세한 단계는 `android/README.md`를 참고하세요.

## 5. iOS

시스템 위젯은 Swift Widget Extension이 필요합니다.  
당분간은 **홈 화면 PWA** + **단축어 앱**으로 `/app?view=day` URL을 여는 방식을 권장합니다.
