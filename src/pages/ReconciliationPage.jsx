import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { reconcile } from '../lib/finance';
import { formatCurrency, toAmount, toText, formatDate } from '../lib/format';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import { Scale, Inbox } from 'lucide-react';

const STATUS_COLOR = {
  'matched': 'badge-success',
  'unmatched': 'badge-warning',
  'low': 'badge-neutral',
};

export default function ReconciliationPage() {
  const { filtered } = useData();
  const { rtgs, billing } = filtered;
  const [tab, setTab] = useState('matched');

  const recon = useMemo(() => reconcile(billing, rtgs), [billing, rtgs]);

  const matchedRows = useMemo(() => recon.matches.map((m, i) => {
    const bAmt = toAmount(m.bill.amount) ?? 0;
    const rAmt = toAmount(m.rtgs.amount) ?? 0;
    const lowConf = /low confidence/i.test(m.reason);
    return {
      id: i,
      billRef: toText(m.bill.invoiceNo) || '—',
      rtgsRef: toText(m.rtgs.txnNo) || toText(m.rtgs.reference) || '—',
      party: toText(m.bill.party) || toText(m.rtgs.party) || '—',
      billAmount: bAmt,
      rtgsAmount: rAmt,
      difference: m.diff,
      matchStatus: lowConf ? 'Low confidence' : 'Matched',
      reason: m.reason,
    };
  }), [recon]);

  const unmatchedBillRows = useMemo(() => recon.unmatchedBills.map((u, i) => ({
    id: i,
    billRef: toText(u.bill.invoiceNo) || '—',
    party: toText(u.bill.party) || '—',
    billAmount: toAmount(u.bill.amount) ?? 0,
    dueDate: u.bill.dueDate,
  })), [recon]);

  const unmatchedRtgsRows = useMemo(() => recon.unmatchedRtgs.map((u, i) => ({
    id: i,
    rtgsRef: toText(u.rtgs.txnNo) || toText(u.rtgs.reference) || '—',
    party: toText(u.rtgs.party) || '—',
    rtgsAmount: toAmount(u.rtgs.amount) ?? 0,
    date: u.rtgs.date,
  })), [recon]);

  const matchedColumns = [
    { key: 'billRef', label: 'Billing Ref', render: (r) => r.billRef },
    { key: 'rtgsRef', label: 'RTGS Ref', render: (r) => r.rtgsRef },
    { key: 'party', label: 'Party', render: (r) => r.party },
    { key: 'billAmount', label: 'Billing Amount', align: 'right', render: (r) => formatCurrency(r.billAmount, '') },
    { key: 'rtgsAmount', label: 'RTGS Amount', align: 'right', render: (r) => formatCurrency(r.rtgsAmount, '') },
    { key: 'difference', label: 'Difference', align: 'right', render: (r) => formatCurrency(r.difference, '') },
    { key: 'matchStatus', label: 'Match Status', render: (r) => <span className={`badge ${r.matchStatus === 'Matched' ? 'badge-success' : 'badge-neutral'}`}>{r.matchStatus}</span> },
    { key: 'reason', label: 'Match Reason', render: (r) => r.reason, maxWidth: 220 },
  ];

  const unmatchedBillCols = [
    { key: 'billRef', label: 'Invoice No.', render: (r) => r.billRef },
    { key: 'party', label: 'Customer/Vendor', render: (r) => r.party },
    { key: 'billAmount', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.billAmount, '') },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) },
  ];

  const unmatchedRtgsCols = [
    { key: 'rtgsRef', label: 'RTGS/Ref No.', render: (r) => r.rtgsRef },
    { key: 'party', label: 'Customer/Vendor', render: (r) => r.party },
    { key: 'rtgsAmount', label: 'Amount', align: 'right', render: (r) => formatCurrency(r.rtgsAmount, '') },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
  ];

  return (
    <div className="fade-in">
      <FilterBar />

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Matched</div><div className="kpi-value">{matchedRows.length}</div><div className="kpi-sub">Billing ↔ RTGS</div></div>
        <div className="kpi-card"><div className="kpi-label">Unmatched Bills</div><div className="kpi-value">{unmatchedBillRows.length}</div><div className="kpi-sub">No payment found</div></div>
        <div className="kpi-card"><div className="kpi-label">Unmatched RTGS</div><div className="kpi-value">{unmatchedRtgsRows.length}</div><div className="kpi-sub">No bill found</div></div>
        <div className="kpi-card"><div className="kpi-label">Amount Mismatches</div><div className="kpi-value">{matchedRows.filter((r) => Math.abs(r.difference) > 1).length}</div><div className="kpi-sub">Matched but differ</div></div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={`btn btn-sm ${tab === 'matched' ? 'btn-primary' : ''}`} onClick={() => setTab('matched')}>Matched ({matchedRows.length})</button>
        <button className={`btn btn-sm ${tab === 'ubill' ? 'btn-primary' : ''}`} onClick={() => setTab('ubill')}>Unmatched Bills ({unmatchedBillRows.length})</button>
        <button className={`btn btn-sm ${tab === 'urtgs' ? 'btn-primary' : ''}`} onClick={() => setTab('urtgs')}>Unmatched RTGS ({unmatchedRtgsRows.length})</button>
      </div>

      {tab === 'matched' && (matchedRows.length ? (
        <DataTable columns={matchedColumns} rows={matchedRows} title="Matched Transactions" emptyTitle="No matches" emptyMessage="No reconciliation matches found." emptyIcon={Inbox} />
      ) : <EmptyState title="No matches found" message="No billing records could be matched to RTGS transactions with the current data." icon={Scale} />)}

      {tab === 'ubill' && (unmatchedBillRows.length ? (
        <DataTable columns={unmatchedBillCols} rows={unmatchedBillRows} title="Unmatched Billing Records" emptyTitle="None" emptyMessage="All bills are matched." />
      ) : <EmptyState title="No unmatched bills" message="All billing records have a matching RTGS payment." icon={Scale} />)}

      {tab === 'urtgs' && (unmatchedRtgsRows.length ? (
        <DataTable columns={unmatchedRtgsCols} rows={unmatchedRtgsRows} title="Unmatched RTGS Transactions" emptyTitle="None" emptyMessage="All RTGS records are matched." />
      ) : <EmptyState title="No unmatched RTGS" message="All RTGS transactions match a billing record." icon={Scale} />)}
    </div>
  );
}
