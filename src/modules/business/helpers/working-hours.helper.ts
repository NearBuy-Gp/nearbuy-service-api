import { WorkingHours } from '../interfaces/working-hours.interface';

// Lower-cased day names indexed to match JS `Date.getDay()` (0 = Sunday).
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/**
 * Derives the `is_open_now` flag from the weekly schedule for *today*.
 *
 * Rules:
 *   - Today's entry exists  -> open === !isClosed (so `isClosed: false` => open).
 *   - Today's entry absent / no schedule -> defaults to open (true).
 *
 * Used at write time (register/update, to keep the stored flag in sync with the
 * schedule) and at read time (response DTOs, so the returned value always
 * reflects the current day regardless of when the schedule was last edited).
 */
export function computeIsOpenNow(workingHours?: WorkingHours[] | null, date: Date = new Date()): boolean {
  if (!workingHours?.length) return true;
  const today = DAY_NAMES[date.getDay()];
  const entry = workingHours.find((wh) => wh?.day?.toLowerCase() === today);
  if (!entry) return true;
  return entry.isClosed !== true;
}
