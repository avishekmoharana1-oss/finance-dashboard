import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { agingBuckets, billOutstanding } from '../lib/finance';
import { formatCurrency, toText, formatDate, toAmount } from '../lib/format';
import { BarChartCard } from '../components/Charts';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import DataTable from '../components/DataTable';
import { Clock, Inbox } from 'lucide-react';

export default function AgingPage() {
  const { filtered, billingRaw } = useData();
  const { billing } = filtered;
  const currency = billingRaw?.currency || '';

  const buckets = useMemo(() => agingBuckets(billing), [billing]);
  const totalAged = buckets.reduce((s, b) => s + b.amount, 0);
  const totalBills = buckets.reduce((s, b) => s + b.count, 0);

  const chartData = buckets.map((b) => ({ key: b.label, value: b.amount, count: b.count }));

  const detailRows = useMemo(() => {
    const today = new Date();
    return billing
      .map((b) => {
        const out = billOutstanding(b);
        const due = b.dueDate;
        if (out == null || out <= 0.005 || !due) return null;
        const days = Math.floor((today - new Date(due)) / 86400000);
        if (days < 0) return null;
        return { ...b, _outstanding: out, _days: days, _due: due };
      })
      .filter(Boolean)
      .sort((a, b) => b._days - a._days);
  }, [billing]);

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No.', render: (r) => toText(r.invoiceNo) || '—' },
    { key: 'party', label: 'Customer/Vendor', render: (r) => toText(r.party) || '—' },
    { key: 'outstanding', label: 'Outstanding', align: 'right', render: (r) => formatCurrency(r._outstanding, currency) },
    { key: 'dueDate', label: 'Due Date', render: (r) => formatDate(r._due) },
    { key: 'days', label: 'Days Overdue', align: 'right', render: (r) => <span style={{ color: r._days > 90 ? 'var(--danger)' : r._days > 30 ? 'var(--warning)' : 'var(--text)' }}>{r._days}</span> },
  ];

  const hasDueDates = billingRaw?.mapping.dueDate && billing.some((b) => b.dueDate);

  return (
    <div className="fade-in">
      <FilterBar />

      {!hasDueDates ? (
        <EmptyState title="Aging analysis unavailable" message="Aging requires billing records with due dates. Your spreadsheet does not appear to have a due-date column, or none of the records contain valid due dates." icon={Clock} />
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card"><div className="kpi-label">Total Aged Outstanding</div><div className="kpi-value">{formatCurrency(totalAged, currency)}</div><div className="kpi-sub">{totalBills} bills past due</div></div>
            <div className="kpi-card"><div className="kpi-label">0–30 Days</div><div className="kpi-value">{formatCurrency(buckets[0].amount, currency)}</div><div className="kpi-sub">{buckets[0].count} bills</div></div>
            <div className="kpi-card"><div className="kpi-label">31–60 Days</div><div className="kpi-value">{formatCurrency(buckets[1].amount, currency)}</div><div className="kpi-sub">{buckets[1].count} bills</div></div>
            <div className="kpi-card"><div className="kpi-label">180+ Days</div><div className="kpi-value" style={{ color: 'var(--danger)' }}>{formatCurrency(buckets[4].amount, currency)}</div><div className="kpi-sub">{buckets[4].count} bills</div></div>
          </div>

          <div className="card section-gap">
            <div className="card-header">
              <div>
                <h3 className="card-title">Outstanding Aging Buckets</h3>
                <p className="card-desc">Amount outstanding by age since due date</p>
              </div>
            </div>
            {chartData.some((d) => d.value > 0) ? (
              <BarChartCard data={chartData} xKey="key" yKey="value" label="Outstanding" color="#f59e0b" currency={currency} height={300} />
            ) : (
              <div className="dim" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No overdue amounts to display.</div>
            )}
          </div>

          {detailRows.length ? (
            <DataTable columns={columns} rows={detailRows} title="Overdue Bills (oldest first)" pageSize={15} emptyIcon={Inbox} />
          ) : (
            <EmptyState title="No overdue invoices" message="No bills are past their due date with an outstanding balance." icon={Clock} />
          )}
        </>
      )}
    </div>
  );
}
