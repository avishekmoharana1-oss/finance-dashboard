import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { classifyBill, billOutstanding } from '../lib/finance';
import { formatCurrency, formatDate, toAmount, toText } from '../lib/format';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { FileText, Inbox } from 'lucide-react';

export default function BillingPage() {
  const { filtered, billingRaw } = useData();
  const { billing } = filtered;
  const currency = billingRaw?.currency || '';
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const hasOutstanding = billingRaw?.mapping.paidAmount && billingRaw?.mapping.amount;

  const statuses = useMemo(() => {
    const set = new Set(['all']);
    billing.forEach((r) => { const s = classifyBill(r); if (s) set.add(s); });
    return [...set];
  }, [billing]);

  const rows = useMemo(() => {
    let r = billing.map((b) => ({
      ...b,
      _status: classifyBill(b),
      _amount: toAmount(b.amount),
      _paid: toAmount(b.paidAmount),
      _outstanding: billOutstanding(b),
    }));
    if (statusFilter !== 'all') r = r.filter((x) => x._status === statusFilter);
    return r;
  }, [billing, statusFilter]);

  const columns = useMemo(() => {
    const cols = [
      { key: 'invoiceNo', label: 'Invoice No.', render: (r) => toText(r.invoiceNo) || '—' },
      { key: 'date', label: 'Invoice Date', render: (r) => formatDate(r.date) },
      { key: 'party', label: 'Customer/Vendor', render: (r) => toText(r.party) || '—' },
      { key: 'amount', label: 'Billing Amount', align: 'right', render: (r) => formatCurrency(toAmount(r.amount), currency), exportKey: '_amount' },
    ];
    if (billingRaw?.mapping.paidAmount) cols.push({ key: 'paidAmount', label: 'Paid', align: 'right', render: (r) => formatCurrency(toAmount(r.paidAmount), currency), exportKey: '_paid' });
    if (hasOutstanding) cols.push({ key: 'outstanding', label: 'Outstanding', align: 'right', render: (r) => formatCurrency(r._outstanding, currency), exportKey: '_outstanding' });
    if (billingRaw?.mapping.dueDate) cols.push({ key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r.dueDate) });
    cols.push({ key: 'status', label: 'Status', render: (r) => <StatusBadge status={r._status} />, exportKey: '_status' });
    if (billingRaw?.mapping.paymentDate) cols.push({ key: 'paymentDate', label: 'Payment Date', render: (r) => formatDate(r.paymentDate) });
    if (billingRaw?.mapping.remarks) cols.push({ key: 'remarks', label: 'Remarks', render: (r) => toText(r.remarks) || '—', maxWidth: 200 });
    return cols;
  }, [billingRaw, currency, hasOutstanding]);

  return (
    <div className="fade-in">
      <FilterBar />

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        <span className="filter-label">Status:</span>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <span className="dim" style={{ fontSize: 12 }}>{rows.length} invoices</span>
      </div>

      {rows.length === 0 && !billing.length ? (
        <EmptyState title="No billing data uploaded yet" message="Upload your Billing spreadsheet from the Data Import page to see invoices here." icon={FileText} />
      ) : rows.length === 0 ? (
        <EmptyState title="No invoices match the filters" message="Try adjusting or resetting the filters." icon={Inbox} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          title="Billing / Invoices"
          onRowClick={setSelected}
          emptyTitle="No invoices"
          emptyMessage="No billing records match the selected filters."
        />
      )}

      {selected && (
        <Modal title="Invoice Details" onClose={() => setSelected(null)}>
          <DetailRow label="Invoice No." value={toText(selected.invoiceNo)} />
          <DetailRow label="Invoice Date" value={formatDate(selected.date)} />
          <DetailRow label="Customer/Vendor" value={toText(selected.party)} />
          <DetailRow label="Billing Amount" value={formatCurrency(toAmount(selected.amount), currency)} />
          {billingRaw?.mapping.paidAmount && <DetailRow label="Paid Amount" value={formatCurrency(toAmount(selected.paidAmount), currency)} />}
          {hasOutstanding && <DetailRow label="Outstanding" value={formatCurrency(selected._outstanding, currency)} />}
          {billingRaw?.mapping.dueDate && <DetailRow label="Due Date" value={formatDate(selected.dueDate)} />}
          <DetailRow label="Status" value={<StatusBadge status={selected._status} />} />
          {billingRaw?.mapping.paymentDate && <DetailRow label="Payment Date" value={formatDate(selected.paymentDate)} />}
          {billingRaw?.mapping.remarks && <DetailRow label="Remarks" value={toText(selected.remarks)} />}
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
