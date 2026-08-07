const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface CountdownPart {
  label: string;
  value: string;
}

export interface CountdownState {
  hasDeadline: boolean;
  isExpired: boolean;
  isBeforeStart: boolean;
  label: string;
  parts: CountdownPart[];
}

export type PollPhase = 'inactive' | 'scheduled' | 'open' | 'closed';

export function getPollPhase(
  isActive: boolean | null | undefined,
  startTime: number | null | undefined,
  endTime: number | null | undefined,
  now: number,
): PollPhase {
  if (!isActive) return 'inactive';
  if (startTime != null && now < startTime) return 'scheduled';
  if (endTime != null && now >= endTime) return 'closed';
  return 'open';
}

export function getCountdownState(
  endTime: number | null | undefined,
  now: number,
  startTime: number | null | undefined = null,
): CountdownState {
  const isBeforeStart = startTime != null && now < startTime;
  const targetTime = isBeforeStart ? startTime : endTime;

  if (targetTime == null) {
    return {
      hasDeadline: false,
      isExpired: false,
      isBeforeStart: false,
      label: 'Không đặt giờ đóng',
      parts: [],
    };
  }

  const remaining = Math.max(0, targetTime - now);
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);

  return {
    hasDeadline: true,
    isExpired: !isBeforeStart && remaining === 0,
    isBeforeStart,
    label: `${days} ngày ${pad(hours)} giờ ${pad(minutes)} phút ${pad(seconds)} giây`,
    parts: [
      { label: 'Ngày', value: String(days) },
      { label: 'Giờ', value: pad(hours) },
      { label: 'Phút', value: pad(minutes) },
      { label: 'Giây', value: pad(seconds) },
    ],
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
