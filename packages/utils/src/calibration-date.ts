import type { CalibrationStatus } from '@metroai/types';

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // Handle month-end overflow (e.g. Jan 31 + 1 month → Feb 28/29)
  if (result.getDate() !== day) {
    result.setDate(0);
  }
  return result;
}

export function computeNextCalibrationDate(lastCalibrationAt: Date, cycleMonths: number): Date {
  return addMonths(lastCalibrationAt, cycleMonths);
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / ONE_DAY);
}

export function classifyCalibrationStatus(
  nextCalibrationAt: Date | null,
  now: Date = new Date(),
): CalibrationStatus {
  if (!nextCalibrationAt) return 'normal';
  const days = daysUntil(nextCalibrationAt, now);
  if (days < 0) return 'overdue';
  if (days <= 30) return 'imminent';
  return 'normal';
}
