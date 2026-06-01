# Day Anchor 위젯 설정 가이드 (처음 하시는 분)

이 가이드는 **Supabase SQL 1회** → **앱에서 위젯 키 발급** → **iPhone / Android 홈 화면에 추가** 순서입니다.  
코딩 경험이 없어도 따라 할 수 있도록 적었습니다.

기술 참고: [WIDGET.md](./WIDGET.md)

---

## 준비물

- Day Anchor에 **로그인**할 수 있어야 합니다 (`https://day-anchor.vercel.app`)
- **Supabase** 프로젝트에 접근할 수 있어야 합니다 (회원가입·일정 저장을 이미 쓰고 있다면 OK)
- **iPhone** 또는 **Android** 폰

---

## 1단계: Supabase SQL 실행 (최초 1회, 약 3분)

위젯 키를 저장할 DB 테이블이 없으면 앱에서 「위젯 키 발급」이 실패합니다.

### 1-1. Supabase 열기

1. 브라우저에서 [https://supabase.com/dashboard](https://supabase.com/dashboard) 접속
2. Day Anchor용 프로젝트 선택 (예: `day-anchor`)

### 1-2. SQL 붙여넣기

1. 왼쪽 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 파일 내용을 **전부** 복사해 붙여넣기  
   - 프로젝트 폴더: `supabase/widget-migration.sql`  
   - 또는 앱 **더보기 → 홈 화면 위젯** 화면의 **「SQL 복사」** 버튼 사용
4. 오른쪽 아래 **Run** (또는 Ctrl+Enter) 클릭
5. 하단에 **Success** / 초록색 성공 메시지가 보이면 OK

`[스크린샷: Supabase SQL Editor에서 Run 버튼]`

### 1-3. 잘 됐는지 확인

1. 왼쪽 **Table Editor** 클릭
2. 목록에 **`widget_tokens`** 테이블이 보이면 성공

(선택) SQL Editor에서 아래 실행:

```sql
select public.get_widget_snapshot('test', null);
```

결과가 `null`이면 함수는 존재하는 것입니다 (테스트 토큰이 없어서 null이 정상).

---

## 2단계: 앱에서 위젯 키 발급 (약 1분)

1. `https://day-anchor.vercel.app` 로그인
2. 하단 **더보기** 탭
3. **홈 화면 위젯** 메뉴
4. 체크리스트 **1단계 SQL** 완료 표시 (직접 체크)
5. **위젯 키 발급** 버튼 클릭
6. **위젯 화면 URL** → **URL 복사**
7. **위젯 미리보기** 링크를 눌러 오늘 일정이 보이는지 확인
8. URL을 메모 앱·메모장에 저장 (나중에 다시 전체 키가 안 보일 수 있음)

발급이 실패하고 `widget_tokens` 같은 글자가 보이면 **1단계 SQL**을 다시 확인하세요.

---

## 3단계: iPhone (Safari)

iOS는 Android처럼 「앱 아이콘 길게 누르기 → 바로가기」가 제한적입니다. 아래 두 가지 중 하나를 쓰세요.

### 3-A. Day Anchor 앱(PWA) 홈 화면에 추가

1. **Safari**에서 `https://day-anchor.vercel.app` 열기
2. 로그인
3. 하단 **공유** 버튼 (네모+화살표)
4. **홈 화면에 추가** → **추가**
5. 홈 화면의 Day Anchor 아이콘으로 앱 실행

### 3-B. 「오늘 일정 위젯」 바로가기 (위젯 URL)

**방법 1 — 북마크**

1. Safari에서 2단계에서 복사한 **위젯 URL** (`.../widget?token=...`) 열기
2. 일정이 보이면 **공유 → 붙여넣기** 또는 북마크 추가
3. 이름을 「오늘 위젯」 등으로 저장

**방법 2 — 단축어 앱**

1. **단축어** 앱 실행 → **+** 새 단축어
2. **URL 열기** 추가 → 위젯 URL 붙여넣기
3. 이름: `Day Anchor 위젯`
4. 단축어 세부 정보 → **홈 화면에 추가**

`[스크린샷: iOS 단축어 URL 열기]`

위젯 화면은 약 **5분마다** 자동으로 새로고침됩니다.

---

## 4단계: Android (Chrome)

### 4-A. Day Anchor 앱 설치 (PWA)

1. **Chrome**에서 `https://day-anchor.vercel.app` 열기
2. 로그인
3. 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가**
4. 홈 화면 아이콘 확인

### 4-B. 아이콘 길게 누르기 (바로가기, 이미 내장)

홈 화면 Day Anchor 아이콘을 **길게 누르면**:

- **오늘 일정** — 오늘 보드
- **+일정** / **+할일** — 빠른 추가
- **위젯 설정** — 키 발급 화면

### 4-C. 위젯 전용 화면을 별도 아이콘으로

1. Chrome에서 **위젯 URL** (`/widget?token=...`) 열기
2. 일정이 보이면 메뉴(⋮) → **홈 화면에 추가** 또는 **바로가기 만들기**
3. 이름: `Day Anchor 위젯`

`[스크린샷: Android 홈 화면 바로가기]`

---

## 5단계: 동작 확인

| 확인 | 기대 결과 |
|------|-----------|
| 위젯 미리보기 | 날짜, 완료 %, 일정·할 일 목록 |
| 앱에서 일정 추가 | 5분 이내 위젯에 반영 (또는 위젯 새로고침) |
| 키 삭제 후 위젯 URL | 로그인 안내 또는 오류 메시지 |

---

## 자주 묻는 문제

| 증상 | 해결 |
|------|------|
| 키 발급 실패, `widget_tokens` 언급 | **1단계 SQL** 다시 Run |
| 위젯에 일정이 안 보임 | URL에 `token=`이 있는지 확인, 키 재발급 |
| 예전 화면이 보임 | PWA 완전 종료 후 재실행, 시크릿 탭에서 테스트 |
| iOS에서 바로가기가 없음 | **3-B 단축어** 또는 북마크 사용 |

---

## (선택) Android Studio 네이티브 위젯

앱 아이콘 안이 아니라 **안드로이드 홈 화면 시스템 위젯**을 만들려면:

- 프로젝트 `android/` 폴더 참고
- [android/README.md](../android/README.md)
- 2단계까지 성공한 뒤 API URL을 `strings.xml`에 넣고 빌드

초보자는 **4-C 웹 위젯 URL**만으로도 충분한 경우가 많습니다.

---

## 요약 체크리스트

- [ ] Supabase SQL 실행 (`widget-migration.sql`)
- [ ] Table Editor에 `widget_tokens` 확인
- [ ] 앱에서 위젯 키 발급 + 미리보기 성공
- [ ] 위젯 URL 저장
- [ ] iPhone 또는 Android 홈 화면에 추가
