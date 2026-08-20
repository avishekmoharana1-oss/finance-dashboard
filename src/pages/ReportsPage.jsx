import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeKpis, agingBuckets, reconcile } from '../lib/finance';
import { exportToCsv, exportToExcel } from '../lib/parse';
import { formatCurrency, toAmount, toText, formatDate } from '../lib/format';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import { BarChart3, Download, FileText, ArrowRightLeft, Clock } from 'lucide-react';

export default function ReportsPage() {
  const { filtered, rtgsRaw, billingRaw } = useData();
  const { rtgs, billing } = filtered;
  const currency = rtgsRaw?.currency || billingRaw?.currency || '';

  const kpis = useMemo(() => computeKpis(rtgs, billing), [rtgs, billing]);
  const buckets = useMemo(() => agingBuckets(billing), [billing]);
  const recon = useMemo(() => reconcile(billing, rtgs), [billing, rtgs]);

  const reports = [
    { id: 'billing', title: 'Billing Report', desc: 'All invoice records with amounts and status', icon: FileText, count: billing.length },
    { id: 'rtgs', title: 'RTGS Transaction Report', desc: 'All payment transactions with status', icon: ArrowRightLeft, count: rtgs.length },
    { id: 'outstanding', title: 'Outstanding Report', desc: 'Bills with outstanding balances', icon: Clock, count: billing.filter((b) => (toAmount(b.amount) ?? 0) - (toAmount(b.paidAmount) ?? 0) > 0).length },
    { id: 'collection', title: 'Payment Collection Report', desc: 'Collection summary and rates', icon: BarChart3, count: 1 },
    { id: 'reconciliation', title: 'Reconciliation Report', desc: 'Matched and unmatched records', icon: BarChart3, count: recon.matches.length + recon.unmatchedBills.length + recon.unmatchedRtgs.length },
    { id: 'aging', title: 'Aging Report', desc: 'Outstanding amounts by age bucket', icon: Clock, count: buckets.filter((b) => b.count > 0).length },
  ];

  const exportReport = (id, type) => {
    let rows = [], headers = [], name = id;
    if (id === 'billing') {
      headers = ['Invoice No', 'Date', 'Party', 'Amount', 'Paid', 'Outstanding', 'Due Date', 'Status'];
      rows = billing.map((b) => ({
        'Invoice No': toText(b.invoiceNo), 'Date': formatDate(b.date), 'Party': toText(b.party),
        'Amount': toAmount(b.amount), 'Paid': toAmount(b.paidAmount),
        'Outstanding': (toAmount(b.amount) ?? 0) - (toAmount(b.paidAmount) ?? 0),
        'Due Date': formatDate(b.dueDate), 'Status': toText(b.status),
      }));
    } else if (id === 'rtgs') {
      headers = ['Txn No', 'Date', 'Party', 'Amount', 'Status', 'Reference', 'Remarks'];
      rows = rtgs.map((r) => ({
        'Txn No': toText(r.txnNo), 'Date': formatDate(r.date), 'Party': toText(r.party),
        'Amount': toAmount(r.amount), 'Status': toText(r.status), 'Reference': toText(r.reference), 'Remarks': toText(r.remarks),
      }));
    } else if (id === 'outstanding') {
      headers = ['Invoice No', 'Party', 'Amount', 'Paid', 'Outstanding', 'Due Date'];
      rows = billing
        .filter((b) => (toAmount(b.amount) ?? 0) - (toAmount(b.paidAmount) ?? 0) > 0)
        .map((b) => ({
          'Invoice No': toText(b.invoiceNo), 'Party': toText(b.party),
          'Amount': toAmount(b.amount), 'Paid': toAmount(b.paidAmount),
          'Outstanding': (toAmount(b.amount) ?? 0) - (toAmount(b.paidAmount) ?? 0),
          'Due Date': formatDate(b.dueDate),
        }));
    } else if (id === 'collection') {
      headers = ['Metric', 'Value'];
      rows = [
        { 'Metric': 'Total Billed', 'Value': kpis.totalBilling },
        { 'Metric': 'Total Received', 'Value': kpis.totalReceived },
        { 'Metric': 'Total Outstanding', 'Value': kpis.totalOutstanding },
        { 'Metric': 'Collection %', 'Value': kpis.collectionPct?.toFixed(2) },
        { 'Metric': 'Total Bills', 'Value': kpis.billingCount },
        { 'Metric': 'Paid Bills', 'Value': kpis.paidBills },
        { 'Metric': 'Overdue Bills', 'Value': kpis.overdueBills },
      ];
    } else if (id === 'reconciliation') {
      headers = ['Billing Ref', 'RTGS Ref', 'Party', 'Billing Amount', 'RTGS Amount', 'Difference', 'Match Status', 'Reason'];
      rows = recon.matches.map((m) => ({
        'Billing Ref': toText(m.bill.invoiceNo), 'RTGS Ref': toText(m.rtgs.txnNo) || toText(m.rtgs.reference),
        'Party': toText(m.bill.party) || toText(m.rtgs.party),
        'Billing Amount': toAmount(m.bill.amount), 'RTGS Amount': toAmount(m.rtgs.amount),
        'Difference': m.diff, 'Match Status': 'Matched', 'Reason': m.reason,
      }));
    } else if (id === 'aging') {
      headers = ['Bucket', 'Bill Count', 'Outstanding Amount'];
      rows = buckets.map((b) => ({ 'Bucket': b.label, 'Bill Count': b.count, 'Outstanding Amount': b.amount }));
    }
    if (type === 'csv') exportToCsv(`${name}.csv`, rows, headers);
    else exportToExcel(`${name}.xlsx`, rows, headers);
  };

  const hasData = rtgs.length > 0 || billing.length > 0;

  return (
    <div className="fade-in">
      <FilterBar />

      {!hasData ? (
        <EmptyState title="No data to report" message="Upload your spreadsheets or reset filters to generate reports." icon={BarChart3} />
      ) : (
        <div className="grid-3">
          {reports.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.id} className="card">
                <div className="flex-between mb-2">
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <span className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', width: 36, height: 36 }}><Icon size={18} /></span>
                    <div>
                      <h3 className="card-title">{r.title}</h3>
                      <p className="card-desc">{r.desc}</p>
                    </div>
                  </div>
                </div>
                <div className="dim mb-4" style={{ fontSize: 12 }}>{r.count} records (current filters)</div>
                <div className="flex gap-2">
                  <button className="btn btn-sm" onClick={() => exportReport(r.id, 'csv')}><Download size={14} /> CSV</button>
                  <button className="btn btn-sm" onClick={() => exportReport(r.id, 'excel')}><Download size={14} /> Excel</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
