// Currency, number, and date formatting utilities.

export function formatCurrency(value, currency) {
  if (value == null || value === '' || isNaN(Number(value))) return '—';
  const num = Number(value);
  const cur = currency || '';
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cur ? `${cur} ${formatted}` : formatted;
}

export function formatCompactCurrency(value, currency) {
  if (value == null || value === '' || isNaN(Number(value))) return '—';
  const num = Number(value);
  const cur = currency || '';
  const abs = Math.abs(num);
  let str;
  if (abs >= 1e9) str = (num / 1e9).toFixed(2) + 'B';
  else if (abs >= 1e6) str = (num / 1e6).toFixed(2) + 'M';
  else if (abs >= 1e3) str = (num / 1e3).toFixed(1) + 'K';
  else str = num.toFixed(0);
  return cur ? `${cur} ${str}` : str;
}

export function formatNumber(value) {
  if (value == null || value === '' || isNaN(Number(value))) return '—';
  return Number(value).toLocaleString();
}

export function formatPercent(value, decimals = 1) {
  if (value == null || value === '' || isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Robust date parser: accepts Date objects, Excel serial dates, ISO strings, dd/mm/yyyy, mm/dd/yyyy.
export function toDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    if (value > 0 && value < 100000) {
      const d = new Date(Math.round((value - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }
  const str = String(value).trim();
  if (!str) return null;
  // ISO yyyy-mm-dd or yyyy/mm/dd
  let m = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})([ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3], m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, m[7] ? +m[7] : 0);
    if (!isNaN(d.getTime())) return d;
  }
  // dd/mm/yyyy or dd-mm-yyyy
  m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})([ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    let day = +m[1], month = +m[2], year = +m[3];
    if (day > 12 && month <= 12) {
      // day first
    } else if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    } else {
      // ambiguous — assume dd/mm
    }
    const d = new Date(year, month - 1, day, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0, m[7] ? +m[7] : 0);
    if (!isNaN(d.getTime())) return d;
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function toAmount(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function toText(value) {
  if (value == null) return '';
  return String(value).trim();
}

export function safeNumber(value) {
  const n = toAmount(value);
  return n == null ? 0 : n;
}
