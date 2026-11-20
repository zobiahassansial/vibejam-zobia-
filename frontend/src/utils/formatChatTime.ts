/** Local wall-clock time as ISO string for persistence. */
export function localTimestamp(): string {
  return new Date().toISOString();
}

/** hh:mm AM/PM with leading zero on hour and minute, uppercase AM/PM. */
export function formatChatTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const legacy = String(value).trim();
    if (/^\d{2}:\d{2}\s*(AM|PM)$/i.test(legacy)) {
      const [time, meridiem] = legacy.split(/\s+/);
      return `${time} ${meridiem.toUpperCase()}`;
    }
    return legacy;
  }
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hour12 = hours24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

export function formatHistoryListTime(iso: string): { time: string; dateLabel: string | null } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { time: formatChatTime(iso), dateLabel: null };
  }
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
  return {
    time: formatChatTime(date),
    dateLabel: isToday ? null : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  };
}