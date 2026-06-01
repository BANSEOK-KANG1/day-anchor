export function formatWidgetError(message: string): string {
  if (
    /widget_tokens|get_widget_snapshot|does not exist|schema cache/i.test(message)
  ) {
    return "Supabase SQL을 아직 실행하지 않은 것 같습니다. 아래 「1단계 Supabase SQL」을 먼저 완료해주세요.";
  }
  return message;
}
