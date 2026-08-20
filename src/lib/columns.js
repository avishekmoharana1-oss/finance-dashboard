// Column auto-detection for RTGS and Billing spreadsheets.
// Maps fuzzy column-name matching to semantic fields without assuming exact names.

const norm = (s) =>
  String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (n, keys) => keys.some((k) => n.includes(k));

export const RTGS_FIELDS = [
  { field: 'txnNo', label: 'Transaction No.', keywords: ['rtgs no', 'transaction no', 'txn no', 'utr', 'transaction id', 'txn id', 'reference no', 'ref no', 'rrn', 'transaction reference'] },
  { field: 'date', label: 'Date', keywords: ['date', 'txn date', 'transaction date', 'value date', 'payment date'] },
  { field: 'party', label: 'Customer/Vendor', keywords: ['customer', 'vendor', 'party', 'name', 'account name', 'beneficiary', 'payer', 'remitter', 'payee', 'client', 'customer name', 'party name'] },
  { field: 'amount', label: 'Amount', keywords: ['amount', 'amt', 'value', 'transaction amount', 'paid amount', 'payment amount', 'transfer amount'] },
  { field: 'status', label: 'Status', keywords: ['status', 'payment status', 'txn status', 'transaction status', 'state'] },
  { field: 'reference', label: 'Reference No.', keywords: ['reference', 'ref', 'utr no', 'cheque no', 'instrument no', 'reference number', 'ref number'] },
  { field: 'bank', label: 'Bank', keywords: ['bank', 'bank name', 'beneficiary bank', 'remitter bank', 'ifsc', 'branch'] },
  { field: 'accountNo', label: 'Account No.', keywords: ['account no', 'account number', 'acct no', 'beneficiary account', 'remitter account', 'a c no'] },
  { field: 'remarks', label: 'Remarks', keywords: ['remarks', 'narration', 'description', 'note', 'notes', 'details', 'particulars', 'memo'] },
  { field: 'invoiceNo', label: 'Invoice No.', keywords: ['invoice', 'bill no', 'bill number', 'invoice no', 'invoice number', 'against invoice', 'bill ref'] },
];

export const BILLING_FIELDS = [
  { field: 'invoiceNo', label: 'Invoice No.', keywords: ['invoice', 'bill no', 'bill number', 'invoice no', 'invoice number', 'bill ref', 'reference no', 'ref no'] },
  { field: 'date', label: 'Invoice Date', keywords: ['date', 'invoice date', 'bill date', 'billing date', 'issue date'] },
  { field: 'party', label: 'Customer/Vendor', keywords: ['customer', 'vendor', 'party', 'name', 'client', 'customer name', 'party name', 'bill to', 'payee', 'payer'] },
  { field: 'amount', label: 'Billing Amount', keywords: ['amount', 'amt', 'value', 'billing amount', 'bill amount', 'invoice amount', 'total amount', 'gross'] },
  { field: 'paidAmount', label: 'Paid Amount', keywords: ['paid', 'paid amount', 'amount paid', 'received', 'received amount', 'payment received', 'collected'] },
  { field: 'dueDate', label: 'Due Date', keywords: ['due date', 'due', 'payment due', 'maturity', 'expected date'] },
  { field: 'paymentDate', label: 'Payment Date', keywords: ['payment date', 'paid date', 'date paid', 'receipt date', 'settlement date', 'cleared date'] },
  { field: 'status', label: 'Status', keywords: ['status', 'payment status', 'bill status', 'invoice status', 'state'] },
  { field: 'remarks', label: 'Remarks', keywords: ['remarks', 'narration', 'description', 'note', 'notes', 'details', 'particulars', 'memo'] },
];

// Detect column mapping from a header row.
// Returns { mapping: { field: originalColumn }, headers: [...], unmatched: [...] }
export function detectColumns(headers, fields) {
  const normed = headers.map(norm);
  const mapping = {};
  const used = new Set();

  // Pass 1: exact-ish keyword containment on normalized header.
  for (const f of fields) {
    let bestCol = null;
    let bestScore = -1;
    for (let i = 0; i < headers.length; i++) {
      if (used.has(i)) continue;
      const n = normed[i];
      if (!n) continue;
      for (const k of f.keywords) {
        if (n === k) {
          if (100 > bestScore) { bestScore = 100; bestCol = i; }
        } else if (n.includes(k)) {
          const score = k.length / n.length * 80;
          if (score > bestScore) { bestScore = score; bestCol = i; }
        }
      }
    }
    if (bestCol != null && bestScore >= 40) {
      mapping[f.field] = headers[bestCol];
      used.add(bestCol);
    }
  }

  const unmatched = headers.filter((_, i) => !used.has(i));
  return { mapping, headers, unmatched };
}

// Normalize a raw row object (from xlsx/csv) into a semantic record using a mapping.
export function mapRow(raw, mapping) {
  const out = {};
  for (const [field, col] of Object.entries(mapping)) {
    out[field] = raw[col];
  }
  // Preserve all original values too.
  out._raw = raw;
  return out;
}

// Guess currency from headers or values. Returns null if none found.
export function detectCurrency(headers) {
  const n = headers.map(norm).join(' ');
  if (n.includes('inr') || n.includes('rupee')) return '₹';
  if (n.includes('usd') || n.includes('dollar')) return '$';
  if (n.includes('eur') || n.includes('euro')) return '€';
  if (n.includes('gbp') || n.includes('pound')) return '£';
  return null;
}
