# Day Anchor Tracking Plan

## 이벤트 설계 원칙

이 프로토타입은 기능 구현뿐 아니라 PM/그로스 포트폴리오에서 설명 가능한 행동 데이터를 남기는 것을 목표로 한다. 모든 핵심 행동은 `activity_events` 개념으로 기록한다.

## 이벤트 목록

| Event Name | Trigger | Properties | 목적 |
|---|---|---|---|
| schedule_created | 일정 생성 | title, type, start, end | 시간 블록 생성 행동 측정 |
| schedule_updated | 일정 수정 | id, title | 계획 변경 빈도 측정 |
| schedule_deleted | 일정 삭제 | id | 삭제/정리 행동 측정 |
| schedule_status_changed | 일정 상태 변경 | id, status | 실행 상태 추적 |
| task_created | 체크리스트 생성 | title | 할 일 생성 행동 측정 |
| task_status_changed | 체크리스트 상태 변경 | id, status | 완료율 계산 |
| task_skipped | 체크리스트 미룸 | id | 미룸 패턴 분석 |
| task_deleted | 체크리스트 삭제 | id | 할 일 정리 행동 측정 |
| note_created | 텍스트 메모 작성 | scheduleBlockId | 기록 행동 측정 |
| voice_recording_started | 음성녹음 시작 | null | 음성 기능 진입 측정 |
| voice_memo_created | 음성메모 저장 | scheduleBlockId | 음성메모 사용률 측정 |
| reminder_created | 메모 알림 생성 | time, prompt | 시간 기반 기록 니즈 측정 |
| reminder_deleted | 메모 알림 삭제 | id | 알림 유지율 측정 |
| tasks_carried_over | 미완료 내일로 넘기기 | count, to | 이월률 계산 |

## 주요 분석 지표

### 1. Daily Plan Created Rate

```text
계획이 있는 날짜 수 / 전체 사용 날짜 수
```

계획이 있는 날짜는 `mainGoal`, `schedules`, `tasks` 중 하나 이상이 존재하는 날짜로 정의한다.

### 2. Task Completion Rate

```text
완료된 task 수 / 전체 task 수
```

### 3. Voice Memo Usage Rate

```text
음성메모가 1개 이상 있는 날짜 수 / 전체 사용 날짜 수
```

### 4. Schedule Edit Frequency

```text
schedule_created + schedule_updated + schedule_deleted 이벤트 수 / 사용 날짜 수
```

### 5. Carry-over Task Rate

```text
carried 상태 또는 tasks_carried_over로 이동한 task 수 / 전체 미완료 task 수
```

## 포트폴리오 설명 포인트

- 단순 화면 구현이 아니라 사용자 행동을 이벤트 단위로 정의했다.
- 일정/할 일/메모/음성메모를 별도 객체로 분리해 분석 가능한 데이터 구조로 만들었다.
- 완료율뿐 아니라 미룸, 이월, 일정 변경 같은 현실적인 사용 패턴도 추적하도록 설계했다.
