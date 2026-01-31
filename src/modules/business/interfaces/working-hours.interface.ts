import { WeekDays } from 'src/utils/enums/week-days.enum';

export interface WorkingHours {
  day: WeekDays;
  From?: string;
  to?: string;
  isClosed?: boolean;
}
