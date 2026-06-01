export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthStartString(dateString: string): string {
  return `${dateString.slice(0, 7)}-01`;
}

export function formatKoreanDate(dateString: string): string {
  const d = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d);
}

export function formatKoreanMonth(dateString: string): string {
  const d = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(d);
}

export function nowTimeString(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function shiftDate(dateString: string, days: number): string {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/** Move a month-start cursor by N months (returns YYYY-MM-01). */
export function shiftMonthCursor(monthStart: string, months: number): string {
  const d = new Date(`${monthStart}T00:00:00`);
  d.setMonth(d.getMonth() + months, 1);
  return monthStartString(getLocalDateString(d));
}

/** Shift a date by N months while preserving day-of-month when possible. */
export function shiftMonthPreserveDay(dateString: string, months: number): string {
  const d = new Date(`${dateString}T00:00:00`);
  const dayOfMonth = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dayOfMonth, lastDay));
  return getLocalDateString(d);
}

/** @deprecated Use shiftMonthCursor or shiftMonthPreserveDay */
export function shiftMonth(dateString: string, months: number): string {
  return shiftMonthCursor(monthStartString(dateString), months);
}

export function formatShortKoreanDate(dateString: string): string {
  const d = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

export function getLastNDates(fromDate: string, n: number): string[] {
  return [...Array(n)].map((_, index) => {
    const d = new Date(`${fromDate}T00:00:00`);
    d.setDate(d.getDate() - index);
    return getLocalDateString(d);
  });
}

export function formatTimeFromDb(time: string): string {
  return time.slice(0, 5);
}

export function escapeHTML(value = ""): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
