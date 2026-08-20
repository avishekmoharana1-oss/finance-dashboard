// Date range presets and helpers for global filtering.

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return d;
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfQuarter(date) {
  const q = Math.floor(date.getMonth() / 3);
  return new Date(date.getFullYear(), q * 3, 1);
}

export function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

export const DATE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Previous Month' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
];

export function resolvePreset(key, customStart, customEnd) {
  const now = new Date();
  switch (key) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday': return { start: startOfDay(addDays(now, -1)), end: endOfDay(addDays(now, -1)) };
    case 'this_week': return { start: startOfWeek(now), end: endOfDay(now) };
    case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case 'this_quarter': return { start: startOfQuarter(now), end: endOfDay(now) };
    case 'this_year': return { start: startOfYear(now), end: endOfDay(now) };
    case 'all': return null;
    case 'custom':
      if (customStart && customEnd) return { start: startOfDay(customStart), end: endOfDay(customEnd) };
      return null;
    default: return null;
  }
}
