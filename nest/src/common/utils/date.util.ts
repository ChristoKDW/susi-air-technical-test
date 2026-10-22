/**
 * Pure date utility functions that NEVER call `new Date()` with system time.
 * All computations are anchored to deterministic UTC calendar arithmetic.
 */

export function pad2(num: number | string): string {
  return String(num).padStart(2, '0');
}

export function parseIsoDate(isoDate: string): { year: number; month: number; day: number } {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid ISO date string: ${isoDate}`);
  }
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Add or subtract days from an ISO date string (YYYY-MM-DD).
 */
export function addDays(isoDate: string, days: number): string {
  const { year, month, day } = parseIsoDate(isoDate);
  // Use UTC to avoid any daylight saving or local timezone skew
  const utcMillis = Date.UTC(year, month - 1, day + days);
  const target = new Date(utcMillis);
  return formatIsoDate(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    target.getUTCDate(),
  );
}

/**
 * Difference in days between two ISO dates: (dateA - dateB).
 * Returns positive if dateA is after dateB, negative if before dateB.
 */
export function diffDays(dateA: string, dateB: string): number {
  const pA = parseIsoDate(dateA);
  const pB = parseIsoDate(dateB);
  const tA = Date.UTC(pA.year, pA.month - 1, pA.day);
  const tB = Date.UTC(pB.year, pB.month - 1, pB.day);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((tA - tB) / msPerDay);
}

/**
 * Generates an inclusive array of date strings [from, ..., to]
 */
export function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let curr = from;
  while (curr <= to) {
    dates.push(curr);
    curr = addDays(curr, 1);
  }
  return dates;
}

/**
 * Validate whether a string is a valid YYYY-MM-DD date.
 */
export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const { year, month, day } = parseIsoDate(dateStr);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() + 1 === month &&
    utc.getUTCDate() === day
  );
}
