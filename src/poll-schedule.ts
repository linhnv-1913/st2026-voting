export const DEFAULT_DURATION_MINUTES = 5;

export function calculateEndTime(
  startTime: number,
  durationMinutes: number,
): number {
  return startTime + durationMinutes * 60_000;
}

export function isValidDurationMinutes(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
