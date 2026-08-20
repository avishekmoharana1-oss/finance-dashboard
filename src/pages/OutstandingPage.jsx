import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { classifyBill, billOutstanding } from '../lib/finance';
import { formatCurrency, formatDate, toAmount, toText } from '../lib/format';
import DataTable from '../components/DataTable';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import { AlertTriangle, Inbox } from 'lucide-react';

export default function OutstandingPage() {
  const { filtered, billingRaw } = useData();
  const { billing } = filtered;
  const currency = billingRaw?.currency || '';

  const rows = useMemo(() => {
    return billing
      .map((b) => ({
        ...b,
        _status: classifyBill(b),
        _outstanding: billOutstanding(b),
        _due: b.dueDate,
      }))
      .filter((r) => r._outstanding != null && r._outstanding > 0.005)
      .sort((a, b) => (b._outstanding || 0) - (a._outstanding || 0));
  }, [billing]);

  const totalOutstanding = rows.reduce((s, r) => s + r._outstanding, 0);
  const overdueOnly = rows.filter((r) => r._status === 'Overdue');
  const totalOverdue = overdueOnly.reduce((s, r) => s + r._outstanding, 0);

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No.', render: (r) => toText(r.invoiceNo) || '—' },
    { key: 'party', label: 'Customer/Vendor', render: (r) => toText(r.party) || '—' },
    { key: 'amount', label: 'Billing Amount', align: 'right', render: (r) => formatCurrency(toAmount(r.amount), currency) },
    { key: 'paidAmount', label: 'Paid', align: 'right', render: (r) => formatCurrency(toAmount(r.paidAmount), currency) },
    { key: 'outstanding', label: 'Outstanding', align: 'right', render: (r) => <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{formatCurrency(r._outstanding, currency)}</span> },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r._due) },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge ${r._status === 'Overdue' ? 'badge-danger' : 'badge-warning'}`}>{r._status}</span> },
  ];

  return (
    <div className="fade-in">
      <FilterBar />

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Total Outstanding</div><div className="kpi-value">{formatCurrency(totalOutstanding, currency)}</div><div className="kpi-sub">{rows.length} bills with balance</div></div>
        <div className="kpi-card"><div className="kpi-label">Overdue Amount</div><div className="kpi-value" style={{ color: 'var(--danger)' }}>{formatCurrency(totalOverdue, currency)}</div><div className="kpi-sub">{overdueOnly.length} overdue bills</div></div>
        <div className="kpi-card"><div className="kpi-label">Partially Paid</div><div className="kpi-value">{rows.filter((r) => r._status === 'Partially Paid').length}</div><div className="kpi-sub">Bills with partial payment</div></div>
        <div className="kpi-card"><div className="kpi-label">Largest Balance</div><div className="kpi-value">{formatCurrency(rows[0]?._outstanding || 0, currency)}</div><div className="kpi-sub">{rows[0]?.party || '—'}</div></div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No outstanding invoices" message="No bills with an outstanding balance were found, or no billing data with paid-amount information is available." icon={AlertTriangle} />
      ) : (
        <DataTable columns={columns} rows={rows} title="Outstanding Bills" pageSize={15} emptyTitle="None" emptyMessage="No outstanding bills." emptyIcon={Inbox} />
      )}
    </div>
  );
}
