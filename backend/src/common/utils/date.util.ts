export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export function endOfUtcDayExclusive(date: Date): Date {
  return addUtcDays(startOfUtcDay(date), 1);
}

export function toUtcDateKey(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}
