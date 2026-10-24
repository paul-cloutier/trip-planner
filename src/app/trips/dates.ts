// Trip dates are calendar days ("2026-11-03"), not moments. Do all the maths
// in UTC so a day never slides across a timezone boundary.

export function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function daysBetween(start: string, end: string) {
  const days: string[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (d <= last && days.length < 366) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

// Calendar helpers. A month is named by its first day ("2026-11-01").

export function monthOf(day: string) {
  return `${day.slice(0, 7)}-01`;
}

export function thisMonth() {
  return monthOf(new Date().toISOString().slice(0, 10));
}

export function shiftMonth(first: string, by: number) {
  const d = new Date(`${first}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 10);
}

export function monthLabel(first: string) {
  return new Date(`${first}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Weeks of a month, Monday first; null pads the first and last week.
export function monthWeeks(first: string) {
  const start = new Date(`${first}T00:00:00Z`);
  const count = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: (start.getUTCDay() + 6) % 7 }, () => null);
  for (let i = 0; i < count; i++) cells.push(`${first.slice(0, 8)}${String(i + 1).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export function formatShort(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatLong(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

// "8 – 11 Oct", or "28 Oct – 2 Nov" across a month.
export function formatSpan(start: string, end: string) {
  const day = (d: string, month: boolean) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      ...(month ? { month: "short" } : {}),
      timeZone: "UTC",
    });
  if (start === end) return day(start, true);
  return `${day(start, start.slice(0, 7) !== end.slice(0, 7))} – ${day(end, true)}`;
}
