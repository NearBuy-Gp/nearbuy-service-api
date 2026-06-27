import { BadRequestException } from '@nestjs/common';

// Lower-cased day names indexed to match JS `Date.getDay()` (0 = Sunday).
// Shared so the working-hours logic uses a single source of truth.
export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export const getDayName = (date: Date = new Date()): string => DAY_NAMES[date.getDay()];

export const toTimeString = (hours: number, minutes: number): string => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const normalizeTime = (raw: string): string => {
  const lower = raw.toLowerCase().trim();

  const hhmm = lower.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const hours = parseInt(hhmm[1], 10);
    const minutes = parseInt(hhmm[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return toTimeString(hours, minutes);
    }
    throw new BadRequestException(`Invalid time value: "${raw}"`);
  }

  const match = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new BadRequestException(`Invalid time value: "${raw}"`);
    }
    if (match[3] === 'pm' && hours !== 12) hours += 12;
    if (match[3] === 'am' && hours === 12) hours = 0;
    return toTimeString(hours, minutes);
  }

  throw new BadRequestException(`Unrecognized time format: "${raw}"`);
};
