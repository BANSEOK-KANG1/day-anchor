# Day Anchor Android 위젯 샘플

이 폴더는 **참고용 스켈레ton**입니다. Play Store 배포용 완성 앱이 아닙니다.

## 빠른 방법 (권장)

앱에서 발급한 **위젯 화면 URL** (`/widget?token=...`)을  
홈 화면 바로가기로 추가하면 WebView 형태로 오늘 일정을 볼 수 있습니다.

## 네이티브 위젯 빌드 (고급)

1. Android Studio → **Open** → `android/` 폴더
2. `local.properties`에 SDK 경로 설정
3. `app/src/main/res/values/strings.xml`의 `widget_api_url`에  
   더보기 → 홈 화면 위젯에서 복사한 **API URL** 붙여넣기
4. Run → 홈 화면에 **Day Anchor Schedule** 위젯 추가

위젯은 30분마다 API를 호출해 일정 제목 3줄을 표시하고, 탭하면 `widget_screen_url`로 앱(브라우저)을 엽니다.

## 파일

- `ScheduleWidgetProvider.kt` — App Widget 업데이트
- `WidgetApiClient.kt` — JSON API 호출

백엔드 URL을 바꾸려면 `strings.xml`만 수정하면 됩니다.
