import { useState, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';
import { parseSpreadsheet } from '../lib/parse';
import { formatNumber, formatDate, toAmount, toText } from '../lib/format';
import { DEMO_RTGS, DEMO_BILLING, DEMO_CURRENCY } from '../lib/demoData';
import { RTGS_FIELDS, BILLING_FIELDS } from '../lib/columns';
import EmptyState from '../components/EmptyState';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Trash2, Sparkles } from 'lucide-react';

export default function DataImportPage() {
  const { loadRtgs, loadBilling, rtgsRaw, billingRaw } = useData();
  const [rtgsPreview, setRtgsPreview] = useState(null);
  const [billingPreview, setBillingPreview] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const rtgsInput = useRef();
  const billingInput = useRef();

  const handleFile = useCallback(async (file, type) => {
    setError(null);
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError(`Unsupported format: .${ext}. Please upload .xlsx, .xls, or .csv files.`);
      return;
    }
    try {
      const result = await parseSpreadsheet(file);
      if (result.errors.length) {
        setError(result.errors.join(' '));
        return;
      }
      if (!result.rows.length) {
        setError('The file appears to be empty.');
        return;
      }
      if (type === 'rtgs') {
        setRtgsPreview({ ...result, fileName: file.name, fieldSet: RTGS_FIELDS });
      } else {
        setBillingPreview({ ...result, fileName: file.name, fieldSet: BILLING_FIELDS });
      }
    } catch (e) {
      setError(`Could not read the file: ${e.message}. The file may be corrupted or password-protected.`);
    }
  }, []);

  const confirmLoad = (type) => {
    const p = type === 'rtgs' ? rtgsPreview : billingPreview;
    if (!p) return;
    if (type === 'rtgs') loadRtgs(p.rows, p.headers, p.currency, 'upload');
    else loadBilling(p.rows, p.headers, p.currency, 'upload');
    if (type === 'rtgs') setRtgsPreview(null);
    else setBillingPreview(null);
  };

  const loadDemo = () => {
    loadRtgs(DEMO_RTGS, Object.keys(DEMO_RTGS[0]), DEMO_CURRENCY, 'demo');
    loadBilling(DEMO_BILLING, Object.keys(DEMO_BILLING[0]), DEMO_CURRENCY, 'demo');
  };

  const onDrop = (e, type) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, type);
  };

  return (
    <div className="fade-in">
      {error && (
        <div className="card mb-4" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}>
          <div className="flex gap-2" style={{ alignItems: 'center', color: 'var(--danger)' }}>
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        </div>
      )}

      <div className="card mb-4" style={{ background: 'var(--primary-soft)', borderColor: 'var(--primary)' }}>
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <Sparkles size={20} style={{ color: 'var(--primary)' }} />
          <div style={{ flex: 1 }}>
            <strong>Want to see how it works first?</strong>
            <div className="dim" style={{ fontSize: 13 }}>Load the built-in demo dataset (clearly labelled) to explore all features.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={loadDemo}>Load Demo Data</button>
        </div>
      </div>

      <div className="grid-2">
        <UploadCard
          title="RTGS Spreadsheet"
          desc="Upload your RTGS / payment transactions file"
          icon={FileSpreadsheet}
          dragOver={dragOver === 'rtgs'}
          onDragOver={(e) => { e.preventDefault(); setDragOver('rtgs'); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => onDrop(e, 'rtgs')}
          onClick={() => rtgsInput.current?.click()}
          inputRef={rtgsInput}
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0], 'rtgs')}
          preview={rtgsPreview}
          onConfirm={() => confirmLoad('rtgs')}
          onCancel={() => setRtgsPreview(null)}
          current={rtgsRaw}
          fieldLabel="RTGS"
        />
        <UploadCard
          title="Billing Spreadsheet"
          desc="Upload your invoices / billing file"
          icon={FileSpreadsheet}
          dragOver={dragOver === 'billing'}
          onDragOver={(e) => { e.preventDefault(); setDragOver('billing'); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => onDrop(e, 'billing')}
          onClick={() => billingInput.current?.click()}
          inputRef={billingInput}
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0], 'billing')}
          preview={billingPreview}
          onConfirm={() => confirmLoad('billing')}
          onCancel={() => setBillingPreview(null)}
          current={billingRaw}
          fieldLabel="Billing"
        />
      </div>

      <div className="card mt-4">
        <h3 className="card-title mb-2">Supported file formats & process</h3>
        <p className="card-desc mb-4">The dashboard reads .xlsx, .xls, and .csv files entirely in your browser — no data leaves your computer.</p>
        <ol style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>Upload your RTGS and/or Billing file above (drag &amp; drop or click).</li>
          <li>The app auto-detects columns and shows a preview for confirmation.</li>
          <li>Click <strong>Load into dashboard</strong> to replace the current data.</li>
          <li>All KPIs, charts, tables, reconciliation, aging, and reports update instantly.</li>
          <li>Use Reset Filters on any page to see the full dataset again.</li>
        </ol>
      </div>
    </div>
  );
}

function UploadCard({ title, desc, icon: Icon, preview, onConfirm, onCancel, current, fieldLabel, ...dropProps }) {
  return (
    <div className="card">
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <span className="kpi-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icon size={18} /></span>
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-desc">{desc}</p>
        </div>
      </div>

      {current && !preview && (
        <div className="flex-between mb-4" style={{ padding: '10px 12px', background: 'var(--success-soft)', borderRadius: 8, border: '1px solid var(--success)' }}>
          <div className="flex gap-2" style={{ alignItems: 'center', color: 'var(--success)' }}>
            <CheckCircle size={15} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatNumber(current.records?.length || 0)} records loaded</span>
          </div>
          <span className="dim" style={{ fontSize: 12 }}>{current.source === 'demo' ? 'Demo' : 'Uploaded'}</span>
        </div>
      )}

      {!preview ? (
        <div
          className={`dropzone ${dropProps.dragOver ? 'drag' : ''}`}
          onClick={dropProps.onClick}
          onDragOver={dropProps.onDragOver}
          onDragLeave={dropProps.onDragLeave}
          onDrop={dropProps.onDrop}
        >
          <div className="dz-icon"><Upload size={32} /></div>
          <div className="dz-title">Drop file here or click to browse</div>
          <div className="dz-sub">.xlsx, .xls, or .csv</div>
          <input ref={dropProps.inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={dropProps.onChange} />
        </div>
      ) : (
        <PreviewPanel preview={preview} fieldLabel={fieldLabel} onConfirm={onConfirm} onCancel={onCancel} />
      )}
    </div>
  );
}

function PreviewPanel({ preview, fieldLabel, onConfirm, onCancel }) {
  const { headers, rows, currency, warnings, fileName } = preview;
  const sample = rows.slice(0, 5);
  return (
    <div>
      <div className="flex-between mb-2">
        <strong style={{ fontSize: 13 }}>{fileName}</strong>
        <span className="dim" style={{ fontSize: 12 }}>{formatNumber(rows.length)} rows · {headers.length} columns</span>
      </div>
      <div className="table-wrap mb-4">
        <div className="table-scroll" style={{ maxHeight: 240 }}>
          <table className="data-table">
            <thead><tr>{headers.map((h) => <th key={h} style={{ fontSize: 11 }}>{h}</th>)}</thead>
            <tbody>
              {sample.map((r, i) => (
                <tr key={i}>{headers.map((h) => <td key={h} style={{ fontSize: 11 }}>{r[h] == null ? '—' : String(r[h]).slice(0, 30)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={onConfirm}>Load into dashboard</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
