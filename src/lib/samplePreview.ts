/** DB에 저장하지 않는 일정 예시 (빈 날 미리보기용) */
export type SchedulePreviewItem = {
  start: string;
  end: string;
  title: string;
  typeLabel: string;
  memo: string;
};

export const SCHEDULE_PREVIEW_ITEMS: SchedulePreviewItem[] = [
  {
    start: "08:30",
    end: "09:00",
    title: "아침 계획 정리",
    typeLabel: "회고",
    memo: "오늘 핵심 목표와 시간표를 정리합니다.",
  },
  {
    start: "10:00",
    end: "12:00",
    title: "집중 작업",
    typeLabel: "딥워크",
    memo: "가장 중요한 일에 2시간을 할애합니다.",
  },
  {
    start: "15:30",
    end: "16:00",
    title: "중간 메모",
    typeLabel: "기록",
    memo: "막힌 부분과 다음 행동을 적습니다.",
  },
];
