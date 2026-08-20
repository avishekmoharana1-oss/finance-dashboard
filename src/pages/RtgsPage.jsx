import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { normalizeRtgsStatus } from '../lib/finance';
import { formatCurrency, formatDate, toAmount, toText } from '../lib/format';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { ArrowRightLeft, Inbox } from 'lucide-react';

export default function RtgsPage() {
  const { filtered, rtgsRaw } = useData();
  const { rtgs } = filtered;
  const currency = rtgsRaw?.currency || '';
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const statuses = useMemo(() => {
    const set = new Set(['all']);
    rtgs.forEach((r) => { const s = normalizeRtgsStatus(r.status); if (s) set.add(s); });
    return [...set];
  }, [rtgs]);

  const rows = useMemo(() => {
    let r = rtgs.map((r) => ({
      ...r,
      _status: normalizeRtgsStatus(r.status),
      _amount: toAmount(r.amount),
    }));
    if (statusFilter !== 'all') r = r.filter((x) => x._status === statusFilter);
    return r;
  }, [rtgs, statusFilter]);

  const columns = useMemo(() => {
    const cols = [
      { key: 'txnNo', label: 'Txn No.', render: (r) => toText(r.txnNo) || '—' },
      { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
      { key: 'party', label: 'Customer/Vendor', render: (r) => toText(r.party) || '—' },
      { key: 'amount', label: 'Amount', align: 'right', render: (r) => formatCurrency(toAmount(r.amount), currency), exportKey: '_amount' },
      { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r._status} />, exportKey: '_status' },
    ];
    if (rtgsRaw?.mapping.reference) cols.push({ key: 'reference', label: 'Reference', render: (r) => toText(r.reference) || '—' });
    if (rtgsRaw?.mapping.bank) cols.push({ key: 'bank', label: 'Bank', render: (r) => toText(r.bank) || '—' });
    if (rtgsRaw?.mapping.accountNo) cols.push({ key: 'accountNo', label: 'Account No.', render: (r) => toText(r.accountNo) || '—' });
    if (rtgsRaw?.mapping.invoiceNo) cols.push({ key: 'invoiceNo', label: 'Invoice No.', render: (r) => toText(r.invoiceNo) || '—' });
    if (rtgsRaw?.mapping.remarks) cols.push({ key: 'remarks', label: 'Remarks', render: (r) => toText(r.remarks) || '—', maxWidth: 200 });
    return cols;
  }, [rtgsRaw, currency]);

  return (
    <div className="fade-in">
      <FilterBar />

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <span className="filter-label">Status:</span>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span className="dim" style={{ fontSize: 12 }}>{rows.length} transactions</span>
      </div>

      {rows.length === 0 && !rtgs.length ? (
        <EmptyState title="No RTGS data uploaded yet" message="Upload your RTGS spreadsheet from the Data Import page to see transactions here." icon={ArrowRightLeft} />
      ) : rows.length === 0 ? (
        <EmptyState title="No transactions match the filters" message="Try adjusting or resetting the filters." icon={Inbox} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          title="RTGS Transactions"
          onRowClick={setSelected}
          emptyTitle="No transactions"
          emptyMessage="No RTGS records match the selected filters."
        />
      )}

      {selected && (
        <Modal title="Transaction Details" onClose={() => setSelected(null)}>
          <DetailRow label="Transaction No." value={toText(selected.txnNo)} />
          <DetailRow label="Date" value={formatDate(selected.date)} />
          <DetailRow label="Customer/Vendor" value={toText(selected.party)} />
          <DetailRow label="Amount" value={formatCurrency(toAmount(selected.amount), currency)} />
          <DetailRow label="Status" value={<StatusBadge status={selected._status} />} />
          {rtgsRaw?.mapping.reference && <DetailRow label="Reference No." value={toText(selected.reference)} />}
          {rtgsRaw?.mapping.bank && <DetailRow label="Bank" value={toText(selected.bank)} />}
          {rtgsRaw?.mapping.accountNo && <DetailRow label="Account No." value={toText(selected.accountNo)} />}
          {rtgsRaw?.mapping.invoiceNo && <DetailRow label="Invoice No." value={toText(selected.invoiceNo)} />}
          {rtgsRaw?.mapping.remarks && <DetailRow label="Remarks" value={toText(selected.remarks)} />}
          <DetailRow label="Source row" value={selected._rowIndex} />
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || '—'}</div>
    </div>
  );
}
