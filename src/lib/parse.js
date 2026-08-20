// Spreadsheet parsing using SheetJS (xlsx) in the browser.
import * as XLSX from 'xlsx';
import { detectColumns, mapRow, detectCurrency } from './columns';

// File -> { headers, rows, mapping, currency, errors, warnings }
export async function parseSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [], mapping: {}, currency: null, errors: ['The file does not contain any sheets.'], warnings: [] };
  }
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
  if (!json.length) {
    return { headers: [], rows: [], mapping: {}, currency: null, errors: ['The first sheet is empty.'], warnings: [] };
  }
  const headers = Object.keys(json[0]);
  return { headers, rows: json, currency: detectCurrency(headers), errors: [], warnings: [] };
}

// Build a typed dataset for a given field set (RTGS_FIELDS or BILLING_FIELDS).
// Returns { records, mapping, headers, currency, issues, duplicates, stats }
export function buildDataset(rawRows, headers, fieldSet, currency) {
  const { mapping, unmatched } = detectColumns(headers, fieldSet);
  const records = [];
  const issues = [];

  rawRows.forEach((raw, idx) => {
    const rec = mapRow(raw, mapping);
    rec._rowIndex = idx + 2; // 1-based + header
    const rowIssues = validateRecord(rec, fieldSet, mapping);
    rowIssues.forEach((i) => issues.push({ row: rec._rowIndex, ...i }));
    records.push(rec);
  });

  const duplicates = findDuplicates(records, mapping);
  return { records, mapping, headers, unmatched, currency, issues, duplicates };
}

function validateRecord(rec, fieldSet, mapping) {
  const issues = [];
  if (mapping.amount) {
    const amt = rec.amount;
    if (amt != null && amt !== '') {
      const n = Number(String(amt).replace(/[^\d.-]/g, ''));
      if (isNaN(n)) issues.push({ severity: 'error', field: 'amount', message: `Invalid amount: "${amt}"` });
      else if (n < 0) issues.push({ severity: 'warning', field: 'amount', message: `Negative amount: ${n}` });
    }
  }
  if (mapping.date) {
    const d = rec.date;
    if (d != null && d !== '') {
      const parsed = toDateSafe(d);
      if (!parsed) issues.push({ severity: 'error', field: 'date', message: `Invalid date: "${d}"` });
    }
  }
  return issues;
}

function toDateSafe(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number' && v > 0 && v < 100000) {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function findDuplicates(records, mapping) {
  const dups = [];
  if (!mapping.txnNo && !mapping.invoiceNo) return dups;
  const keyField = mapping.txnNo ? 'txnNo' : 'invoiceNo';
  const seen = new Map();
  records.forEach((r) => {
    const k = r[keyField];
    if (k == null || k === '') return;
    const key = String(k).trim().toLowerCase();
    if (seen.has(key)) {
      dups.push({ row: r._rowIndex, field: keyField, value: k, firstRow: seen.get(key) });
    } else {
      seen.set(key, r._rowIndex);
    }
  });
  return dups;
}

// CSV export helper.
export function exportToCsv(filename, rows, headers) {
  const cols = headers || (rows.length ? Object.keys(rows[0]) : []);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => escape(r[c])).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

// Excel export helper.
export function exportToExcel(filename, rows, headers) {
  const cols = headers || (rows.length ? Object.keys(rows[0]) : []);
  const data = [cols];
  for (const r of rows) {
    data.push(cols.map((c) => (r[c] == null ? '' : r[c])));
  }
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
