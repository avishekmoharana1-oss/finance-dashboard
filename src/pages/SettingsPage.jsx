import { useData } from '../context/DataContext';
import { RTGS_FIELDS, BILLING_FIELDS } from '../lib/columns';
import { formatNumber, toText } from '../lib/format';
import EmptyState from '../components/EmptyState';
import { Settings as SettingsIcon, Moon, Sun, Database, Map } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme, rtgsRaw, billingRaw } = useData();

  return (
    <div className="fade-in">
      <div className="card section-gap">
        <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
          <SettingsIcon size={18} className="dim" />
          <h3 className="card-title">Appearance</h3>
        </div>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : ''}`} onClick={() => setTheme('dark')}>
            <Moon size={14} /> Dark
          </button>
          <button className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : ''}`} onClick={() => setTheme('light')}>
            <Sun size={14} /> Light
          </button>
        </div>
      </div>

      <div className="card section-gap">
        <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
          <Database size={18} className="dim" />
          <h3 className="card-title">Loaded Data</h3>
        </div>
        <div className="grid-2">
          <DataSummary label="RTGS" ds={rtgsRaw} />
          <DataSummary label="Billing" ds={billingRaw} />
        </div>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
          <Map size={18} className="dim" />
          <h3 className="card-title">Column Mapping</h3>
        </div>
        <p className="card-desc mb-4">How the detected spreadsheet columns map to dashboard fields. This is auto-detected from your file headers.</p>
        <div className="grid-2">
          {rtgsRaw && <ColumnMap label="RTGS Mapping" mapping={rtgsRaw.mapping} fields={RTGS_FIELDS} headers={rtgsRaw.headers} />}
          {billingRaw && <ColumnMap label="Billing Mapping" mapping={billingRaw.mapping} fields={BILLING_FIELDS} headers={billingRaw.headers} />}
        </div>
      </div>
    </div>
  );
}

function DataSummary({ label, ds }) {
  if (!ds) return <div className="stat-tile"><span className="stat-label">{label}</span><span className="dim">Not loaded</span></div>;
  return (
    <div className="stat-tile" style={{ gap: 8 }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{formatNumber(ds.records.length)} records</span>
      <span className="dim" style={{ fontSize: 12 }}>
        {ds.source === 'demo' ? 'Demo dataset' : 'Uploaded file'} · {ds.currency || 'No currency detected'}
      </span>
    </div>
  );
}

function ColumnMap({ label, mapping, fields, headers }) {
  return (
    <div>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <table className="data-table mt-2" style={{ fontSize: 12 }}>
        <thead><tr><th>Dashboard Field</th><th>Spreadsheet Column</th></tr></thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f.field}>
              <td>{f.label}</td>
              <td>{mapping[f.field] ? <span style={{ color: 'var(--success)' }}>{mapping[f.field]}</span> : <span className="dim">Not detected</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {headers.length > Object.keys(mapping).length && (
        <div className="dim mt-2" style={{ fontSize: 11 }}>
          Unmapped columns: {headers.filter((h) => !Object.values(mapping).includes(h)).join(', ')}
        </div>
      )}
    </div>
  );
}
