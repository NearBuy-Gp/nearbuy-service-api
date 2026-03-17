export const toTimeString = (hours: number, minutes: number): string => {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const normalizeTime = (raw: string): string => {
  const lower = raw.toLowerCase().trim();
  if (/^\d{2}:\d{2}$/.test(lower)) return lower;

  const match = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2] ?? '0');
    if (match[3] === 'pm' && hours !== 12) hours += 12;
    if (match[3] === 'am' && hours === 12) hours = 0;
    return toTimeString(hours, minutes);
  }

  return raw;
};
