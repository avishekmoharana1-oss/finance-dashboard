// Financial calculations derived from parsed RTGS + Billing datasets.
import { toDate, toAmount, toText } from './format';

// Normalize an RTGS status string into a canonical bucket.
export function normalizeRtgsStatus(value) {
  const s = toText(value).toLowerCase();
  if (!s) return 'Unknown';
  if (/(success|completed|complete|paid|received|cleared|settled|acknowledged|accept)/.test(s)) return 'Successful';
  if (/(pending|awaiting|waiting|in process|processing|initiated|queued|unverified)/.test(s)) return 'Pending';
  if (/(process)/.test(s)) return 'Processing';
  if (/(fail|reject|bounce|declined|return|cancelled|cancel|revers)/.test(s)) return 'Failed';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Classify a billing record into Paid / Partially Paid / Pending / Overdue.
// Only returns Overdue when a valid due date exists and outstanding > 0.
export function classifyBill(rec, today = new Date()) {
  const amount = toAmount(rec.amount);
  const paid = toAmount(rec.paidAmount);
  const dueDate = toDate(rec.dueDate);

  if (amount == null) return 'Unknown';
  const outstanding = amount - (paid ?? 0);

  // Explicit status takes priority if it maps clearly.
  const s = toText(rec.status).toLowerCase();
  if (/(paid|full|close|completed)/.test(s) && outstanding <= 0.005) return 'Paid';
  if (/(partial|partly)/.test(s) || (paid != null && paid > 0 && outstanding > 0.005)) return 'Partially Paid';
  if (dueDate && outstanding > 0.005 && dueDate < today) return 'Overdue';
  if (outstanding <= 0.005) return 'Paid';
  if (paid == null || paid === 0) return 'Pending';
  return 'Pending';
}

export function billOutstanding(rec) {
  const amount = toAmount(rec.amount);
  const paid = toAmount(rec.paidAmount);
  if (amount == null) return null;
  return Math.max(0, amount - (paid ?? 0));
}

// Filter records by a date range on a given field.
export function filterByDateRange(records, dateField, range) {
  if (!range || !range.start || !range.end) return records;
  const start = range.start, end = range.end;
  return records.filter((r) => {
    const d = toDate(r[dateField]);
    if (!d) return false;
    return d >= start && d <= end;
  });
}

// KPIs for the dashboard, computed from filtered datasets.
export function computeKpis(rtgs, billing, opts = {}) {
  const today = opts.today || new Date();
  const totalRtgs = rtgs.reduce((s, r) => s + (toAmount(r.amount) ?? 0), 0);
  const totalBilling = billing.reduce((s, r) => s + (toAmount(r.amount) ?? 0), 0);
  const totalReceived = billing.reduce((s, r) => s + (toAmount(r.paidAmount) ?? 0), 0)
    + rtgs.filter((r) => /success/i.test(toText(r.status))).reduce((s, r) => s + (toAmount(r.amount) ?? 0), 0);
  const totalOutstanding = billing.reduce((s, r) => s + (billOutstanding(r) ?? 0), 0);

  const billStatuses = billing.map((r) => classifyBill(r, today));
  const paidBills = billStatuses.filter((s) => s === 'Paid').length;
  const partialBills = billStatuses.filter((s) => s === 'Partially Paid').length;
  const pendingBills = billStatuses.filter((s) => s === 'Pending').length;
  const overdueBills = billStatuses.filter((s) => s === 'Overdue').length;

  const rtgsStatuses = rtgs.map((r) => normalizeRtgsStatus(r.status));
  const successfulRtgs = rtgsStatuses.filter((s) => s === 'Successful').length;
  const failedRtgs = rtgsStatuses.filter((s) => s === 'Failed').length;
  const pendingRtgs = rtgsStatuses.filter((s) => s === 'Pending' || s === 'Processing').length;

  const collectionPct = totalBilling > 0 ? (totalReceived / totalBilling) * 100 : null;

  return {
    totalRtgs, totalBilling, totalReceived, totalOutstanding, collectionPct,
    rtgsCount: rtgs.length, billingCount: billing.length,
    paidBills, partialBills, pendingBills, overdueBills,
    successfulRtgs, failedRtgs, pendingRtgs,
  };
}

// Aging buckets for outstanding bills.
export function agingBuckets(billing, today = new Date()) {
  const buckets = [
    { key: '0-30', label: '0–30 days', min: 0, max: 30, count: 0, amount: 0 },
    { key: '31-60', label: '31–60 days', min: 31, max: 60, count: 0, amount: 0 },
    { key: '61-90', label: '61–90 days', min: 61, max: 90, count: 0, amount: 0 },
    { key: '91-180', label: '91–180 days', min: 91, max: 180, count: 0, amount: 0 },
    { key: '180+', label: '180+ days', min: 181, max: Infinity, count: 0, amount: 0 },
  ];
  for (const r of billing) {
    const out = billOutstanding(r);
    if (out == null || out <= 0.005) continue;
    const due = toDate(r.dueDate);
    if (!due) continue;
    const days = Math.floor((today - due) / 86400000);
    if (days < 0) continue;
    const b = buckets.find((x) => days >= x.min && days <= x.max);
    if (b) { b.count++; b.amount += out; }
  }
  return buckets;
}

// Trend aggregation: sum of amount per day/month.
export function buildTrend(records, dateField, valueField, granularity = 'day') {
  const map = new Map();
  for (const r of records) {
    const d = toDate(r[dateField]);
    const v = toAmount(r[valueField]);
    if (!d || v == null) continue;
    const key = granularity === 'month'
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + v);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
}

// Customer/vendor aggregation.
export function customerAggregates(billing, rtgs, today = new Date()) {
  const map = new Map();
  const ensure = (name) => {
    if (!map.has(name)) map.set(name, { name, billing: 0, paid: 0, outstanding: 0, bills: 0, rtgs: 0, rtgsAmount: 0 });
    return map.get(name);
  };
  for (const r of billing) {
    const name = toText(r.party) || 'Unknown';
    const amt = toAmount(r.amount) ?? 0;
    const paid = toAmount(r.paidAmount) ?? 0;
    const out = billOutstanding(r) ?? 0;
    const e = ensure(name);
    e.billing += amt; e.paid += paid; e.outstanding += out; e.bills++;
  }
  for (const r of rtgs) {
    const name = toText(r.party) || 'Unknown';
    const amt = toAmount(r.amount) ?? 0;
    const e = ensure(name);
    e.rtgs++; e.rtgsAmount += amt;
  }
  const list = [...map.values()];
  list.forEach((e) => {
    e.performance = e.billing > 0 ? (e.paid / e.billing) * 100 : null;
  });
  return list;
}

// Reconciliation: match billing to RTGS by amount ± tolerance and/or invoice/party.
export function reconcile(billing, rtgs, opts = {}) {
  const tolerance = opts.tolerance ?? 1.00;
  const matches = [];
  const matchedBillIdx = new Set();
  const matchedRtgsIdx = new Set();

  // Pass 1: exact invoice number match.
  billing.forEach((b, bi) => {
    if (matchedBillIdx.has(bi)) return;
    const inv = toText(b.invoiceNo).toLowerCase();
    if (!inv) return;
    rtgs.forEach((r, ri) => {
      if (matchedRtgsIdx.has(ri)) return;
      const rInv = toText(r.invoiceNo).toLowerCase();
      const rRef = toText(r.reference).toLowerCase();
      const rTxn = toText(r.txnNo).toLowerCase();
      if (rInv === inv || rRef === inv || rTxn === inv) {
        const bAmt = toAmount(b.amount) ?? 0;
        const rAmt = toAmount(r.amount) ?? 0;
        const diff = bAmt - rAmt;
        matches.push({ bill: b, rtgs: r, billIdx: bi, rtgsIdx: ri, diff, reason: 'Invoice/Reference number match' });
        matchedBillIdx.add(bi); matchedRtgsIdx.add(ri);
      }
    });
  });

  // Pass 2: amount + party match.
  billing.forEach((b, bi) => {
    if (matchedBillIdx.has(bi)) return;
    const bAmt = toAmount(b.amount);
    const bParty = toText(b.party).toLowerCase();
    if (bAmt == null || !bParty) return;
    rtgs.forEach((r, ri) => {
      if (matchedRtgsIdx.has(ri)) return;
      const rAmt = toAmount(r.amount);
      const rParty = toText(r.party).toLowerCase();
      if (rAmt == null || !rParty) return;
      if (Math.abs(bAmt - rAmt) <= tolerance && (bParty === rParty || bParty.includes(rParty) || rParty.includes(bParty))) {
        matches.push({ bill: b, rtgs: r, billIdx: bi, rtgsIdx: ri, diff: bAmt - rAmt, reason: 'Amount + Customer match' });
        matchedBillIdx.add(bi); matchedRtgsIdx.add(ri);
      }
    });
  });

  // Pass 3: amount-only match within tolerance (low confidence).
  billing.forEach((b, bi) => {
    if (matchedBillIdx.has(bi)) return;
    const bAmt = toAmount(b.amount);
    if (bAmt == null) return;
    rtgs.forEach((r, ri) => {
      if (matchedRtgsIdx.has(ri)) return;
      const rAmt = toAmount(r.amount);
      if (rAmt == null) return;
      if (Math.abs(bAmt - rAmt) <= tolerance) {
        matches.push({ bill: b, rtgs: r, billIdx: bi, rtgsIdx: ri, diff: bAmt - rAmt, reason: 'Amount match (low confidence)' });
        matchedBillIdx.add(bi); matchedRtgsIdx.add(ri);
      }
    });
  });

  const unmatchedBills = billing.map((b, i) => ({ bill: b, idx: i })).filter((x) => !matchedBillIdx.has(x.idx));
  const unmatchedRtgs = rtgs.map((r, i) => ({ rtgs: r, idx: i })).filter((x) => !matchedRtgsIdx.has(x.idx));

  return { matches, unmatchedBills, unmatchedRtgs };
}

// Generate alerts from datasets.
export function generateAlerts(rtgs, billing, duplicates, today = new Date()) {
  const alerts = [];
  const add = (severity, title, message, ref) => alerts.push({ severity, title, message, ref });

  for (const r of billing) {
    const out = billOutstanding(r);
    const status = classifyBill(r, today);
    if (status === 'Overdue') {
      add('Critical', 'Overdue Bill', `Bill ${toText(r.invoiceNo) || '(no number)'} for ${toText(r.party)} is overdue by ${formatCurrency(out)}`, r);
    } else if (out != null && out > 0 && out >= 100000) {
      add('High', 'Large Outstanding', `Bill ${toText(r.invoiceNo) || '(no number)'} has ${formatCurrency(out)} outstanding`, r);
    }
  }
  for (const r of rtgs) {
    const st = normalizeRtgsStatus(r.status);
    if (st === 'Failed') {
      add('High', 'Failed RTGS', `Transaction ${toText(r.txnNo) || toText(r.reference) || '(no ref)'} failed`, r);
    }
  }
  for (const d of duplicates) {
    add('Medium', 'Duplicate Record', `Duplicate ${d.field} "${d.value}" found at rows ${d.firstRow} and ${d.row}`, d);
  }
  for (const r of billing) {
    if (toAmount(r.amount) == null && toText(r.invoiceNo)) {
      add('Low', 'Missing Amount', `Bill ${toText(r.invoiceNo)} has no valid amount`, r);
    }
  }
  for (const r of rtgs) {
    if (toAmount(r.amount) == null && (toText(r.txnNo) || toText(r.reference))) {
      add('Low', 'Missing Amount', `RTGS ${toText(r.txnNo) || toText(r.reference)} has no valid amount`, r);
    }
  }
  const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return alerts;
}

function formatCurrency(v) {
  if (v == null) return '—';
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
