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
  label: string;
  parts: CountdownPart[];
}

export function getCountdownState(endTime: number | null | undefined, now: number): CountdownState {
  if (!endTime) {
    return {
      hasDeadline: false,
      isExpired: false,
      label: 'Không đặt giờ đóng',
      parts: [],
    };
  }

  const remaining = Math.max(0, endTime - now);
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);

  return {
    hasDeadline: true,
    isExpired: remaining === 0,
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
