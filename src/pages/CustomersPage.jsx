import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { customerAggregates } from '../lib/finance';
import { formatCurrency, formatNumber, formatPercent, toText, formatDate, toAmount } from '../lib/format';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { Users, Inbox } from 'lucide-react';

export default function CustomersPage() {
  const { filtered, rtgsRaw, billingRaw } = useData();
  const { rtgs, billing } = filtered;
  const currency = rtgsRaw?.currency || billingRaw?.currency || '';
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('billing');

  const customers = useMemo(() => customerAggregates(billing, rtgs), [billing, rtgs]);
  const sorted = useMemo(() => {
    const arr = [...customers];
    arr.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    return arr;
  }, [customers, sortBy]);

  const columns = [
    { key: 'name', label: 'Customer/Vendor', render: (r) => r.name },
    { key: 'billing', label: 'Total Billed', align: 'right', render: (r) => formatCurrency(r.billing, currency) },
    { key: 'paid', label: 'Total Paid', align: 'right', render: (r) => formatCurrency(r.paid, currency) },
    { key: 'outstanding', label: 'Outstanding', align: 'right', render: (r) => <span style={{ color: r.outstanding > 0 ? 'var(--warning)' : 'var(--text)' }}>{formatCurrency(r.outstanding, currency)}</span> },
    { key: 'bills', label: 'Bills', align: 'right', render: (r) => formatNumber(r.bills) },
    { key: 'rtgs', label: 'RTGS', align: 'right', render: (r) => formatNumber(r.rtgs) },
    { key: 'performance', label: 'Collection %', align: 'right', render: (r) => r.performance != null ? formatPercent(r.performance) : '—' },
  ];

  const selectedDetail = useMemo(() => {
    if (!selected) return null;
    const b = billing.filter((r) => toText(r.party) === selected);
    const r = rtgs.filter((x) => toText(x.party) === selected);
    return { bills: b, rtgs: r };
  }, [selected, billing, rtgs]);

  return (
    <div className="fade-in">
      <FilterBar />

      <div className="flex gap-2 mb-4">
        <span className="filter-label" style={{ alignSelf: 'center' }}>Sort by:</span>
        <button className={`btn btn-sm ${sortBy === 'billing' ? 'btn-primary' : ''}`} onClick={() => setSortBy('billing')}>Billing</button>
        <button className={`btn btn-sm ${sortBy === 'paid' ? 'btn-primary' : ''}`} onClick={() => setSortBy('paid')}>Paid</button>
        <button className={`btn btn-sm ${sortBy === 'outstanding' ? 'btn-primary' : ''}`} onClick={() => setSortBy('outstanding')}>Outstanding</button>
        <button className={`btn btn-sm ${sortBy === 'rtgs' ? 'btn-primary' : ''}`} onClick={() => setSortBy('rtgs')}>RTGS Volume</button>
      </div>

      {customers.length === 0 || (customers.length === 1 && customers[0].name === 'Unknown') ? (
        <EmptyState title="No customer/vendor data" message="No customer or vendor names were found in the uploaded data." icon={Users} />
      ) : (
        <DataTable
          columns={columns}
          rows={sorted}
          title="Customers / Vendors"
          onRowClick={(r) => setSelected(r.name)}
          emptyTitle="No customers"
          emptyMessage="No customer/vendor records."
          emptyIcon={Inbox}
        />
      )}

      {selected && selectedDetail && (
        <Modal title={`${selected} — Financial History`} onClose={() => setSelected(null)}>
          <h4 style={{ margin: '0 0 8px' }}>Bills ({selectedDetail.bills.length})</h4>
          {selectedDetail.bills.length === 0 ? <p className="dim">No billing records.</p> : (
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr><th>Invoice</th><th>Date</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {selectedDetail.bills.map((b, i) => (
                  <tr key={i}><td>{toText(b.invoiceNo) || '—'}</td><td>{formatDate(b.date)}</td><td className="num">{formatCurrency(toAmount(b.amount), currency)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <h4 style={{ margin: '0 0 8px' }}>RTGS Transactions ({selectedDetail.rtgs.length})</h4>
          {selectedDetail.rtgs.length === 0 ? <p className="dim">No RTGS records.</p> : (
            <table className="data-table">
              <thead><tr><th>Txn No.</th><th>Date</th><th className="num">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {selectedDetail.rtgs.map((r, i) => (
                  <tr key={i}><td>{toText(r.txnNo) || '—'}</td><td>{formatDate(r.date)}</td><td className="num">{formatCurrency(toAmount(r.amount), currency)}</td><td>{toText(r.status) || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  );
}
