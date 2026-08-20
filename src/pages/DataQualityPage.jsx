import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { toText, toAmount, toDate, formatDate } from '../lib/format';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import { ShieldCheck, AlertTriangle, Copy, Inbox } from 'lucide-react';

export default function DataQualityPage() {
  const { rtgsRaw, billingRaw } = useData();

  const stats = useMemo(() => {
    const compute = (ds, label) => {
      if (!ds) return null;
      const total = ds.records.length;
      const issues = ds.issues || [];
      const duplicates = ds.duplicates || [];
      const invalidAmounts = issues.filter((i) => i.field === 'amount' && i.severity === 'error').length;
      const invalidDates = issues.filter((i) => i.field === 'date' && i.severity === 'error').length;
      const missingValues = ds.records.reduce((s, r) => {
        Object.values(r).forEach((v) => { if (v == null || v === '') s++; });
        return s;
      }, 0);
      const problemRows = new Set();
      issues.forEach((i) => problemRows.add(i.row));
      duplicates.forEach((d) => { problemRows.add(d.row); problemRows.add(d.firstRow); });
      return {
        label, total, valid: total - problemRows.size, invalid: problemRows.size,
        missingValues, duplicates: duplicates.length, invalidAmounts, invalidDates,
        issueRows: [...problemRows].sort((a, b) => a - b),
        issues, duplicateList: duplicates,
      };
    };
    return {
      rtgs: compute(rtgsRaw, 'RTGS'),
      billing: compute(billingRaw, 'Billing'),
    };
  }, [rtgsRaw, billingRaw]);

  const issueColumns = [
    { key: 'source', label: 'Source', render: (r) => r.source },
    { key: 'row', label: 'Row', align: 'right', render: (r) => r.row },
    { key: 'severity', label: 'Severity', render: (r) => <span className={`badge ${r.severity === 'error' ? 'badge-danger' : 'badge-warning'}`}>{r.severity}</span> },
    { key: 'field', label: 'Field', render: (r) => r.field },
    { key: 'message', label: 'Issue', render: (r) => r.message },
  ];

  const allIssues = useMemo(() => {
    const out = [];
    if (stats.rtgs?.issues) stats.rtgs.issues.forEach((i) => out.push({ ...i, source: 'RTGS' }));
    if (stats.billing?.issues) stats.billing.issues.forEach((i) => out.push({ ...i, source: 'Billing' }));
    return out;
  }, [stats]);

  const hasData = stats.rtgs || stats.billing;

  return (
    <div className="fade-in">
      {!hasData ? (
        <EmptyState title="No data loaded" message="Upload a spreadsheet to see data-quality metrics here." icon={ShieldCheck} />
      ) : (
        <>
          <div className="grid-2 section-gap">
            {stats.rtgs && <QualityCard label="RTGS Data Quality" stats={stats.rtgs} />}
            {stats.billing && <QualityCard label="Billing Data Quality" stats={stats.billing} />}
          </div>

          <div className="card section-gap">
            <h3 className="card-title mb-4">Data Quality Summary</h3>
            <p className="card-desc mb-4">Original values are never modified. Issues are reported only — you decide whether to correct them in your source spreadsheet and re-upload.</p>
          </div>

          {allIssues.length > 0 || (stats.rtgs?.duplicateList.length || 0) + (stats.billing?.duplicateList.length || 0) > 0 ? (
            <DataTable
              columns={issueColumns}
              rows={allIssues}
              title="Detected Issues"
              pageSize={15}
              emptyTitle="No issues found"
              emptyMessage="All records passed validation."
              emptyIcon={Inbox}
            />
          ) : (
            <EmptyState title="No issues detected" message="All records passed validation. No invalid amounts, dates, or duplicates were found." icon={ShieldCheck} />
          )}
        </>
      )}
    </div>
  );
}

function QualityCard({ label, stats }) {
  const tiles = [
    { label: 'Total Records', value: stats.total, tone: 'var(--text)' },
    { label: 'Valid', value: stats.valid, tone: 'var(--success)' },
    { label: 'Invalid', value: stats.invalid, tone: 'var(--danger)' },
    { label: 'Missing Values', value: stats.missingValues, tone: 'var(--warning)' },
    { label: 'Duplicates', value: stats.duplicates, tone: 'var(--warning)' },
    { label: 'Invalid Amounts', value: stats.invalidAmounts, tone: 'var(--danger)' },
    { label: 'Invalid Dates', value: stats.invalidDates, tone: 'var(--danger)' },
  ];
  return (
    <div className="card">
      <h3 className="card-title mb-4">{label}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
        {tiles.map((t) => (
          <div key={t.label} className="stat-tile">
            <span className="stat-label">{t.label}</span>
            <span className="stat-value" style={{ color: t.tone }}>{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
