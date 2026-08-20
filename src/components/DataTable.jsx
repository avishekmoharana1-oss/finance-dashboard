import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Search, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { exportToCsv, exportToExcel } from '../lib/parse';
import EmptyState from './EmptyState';

// columns: [{ key, label, render?, sortable?, width?, align?, exportKey? }]
// rows: array of objects
export default function DataTable({ columns, rows, title, searchable = true, onRowClick, pageSize = 12, emptyTitle, emptyMessage, emptyIcon }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showExport, setShowExport] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.exportKey ? r[c.exportKey] : r[c.key];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || col.sortable === false) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(col.key); setSortDir('asc'); }
  };

  const doExport = (type) => {
    setShowExport(false);
    const exportCols = columns.filter((c) => c.exportKey || c.key);
    const headers = exportCols.map((c) => c.label);
    const data = sorted.map((r) => {
      const o = {};
      exportCols.forEach((c) => { o[c.label] = r[c.exportKey || c.key]; });
      return o;
    });
    const name = (title || 'export').toLowerCase().replace(/\s+/g, '_');
    if (type === 'csv') exportToCsv(`${name}.csv`, data, headers);
    else exportToExcel(`${name}.xlsx`, data, headers);
  };

  return (
    <div className="table-wrap fade-in">
      <div className="table-tools">
        {title && <strong style={{ fontSize: 14 }}>{title}</strong>}
        <div style={{ flex: 1 }} />
        {searchable && (
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-dim)' }} />
            <input
              className="input"
              style={{ paddingLeft: 30, width: 220 }}
              placeholder="Search..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-sm" onClick={() => setShowExport((s) => !s)}>
            <Download size={14} /> Export
          </button>
          {showExport && (
            <div style={{ position: 'absolute', right: 0, top: 34, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 20, boxShadow: 'var(--shadow-lg)' }}>
              <button className="btn btn-ghost btn-sm full" style={{ justifyContent: 'flex-start' }} onClick={() => doExport('csv')}>CSV (.csv)</button>
              <button className="btn btn-ghost btn-sm full" style={{ justifyContent: 'flex-start' }} onClick={() => doExport('excel')}>Excel (.xlsx)</button>
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle || 'No records'} message={emptyMessage || 'No records match the current filters.'} icon={emptyIcon} />
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      style={{ width: c.width, textAlign: c.align || 'left' }}
                      onClick={() => toggleSort(c)}
                    >
                      {c.label}
                      {sortKey === c.key && (
                        <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </th>
                  ))}
                  {onRowClick && <th style={{ width: 60 }}>View</th>}
                </tr>
              </thead>
              <tbody>
                {paged.map((r, i) => (
                  <tr key={i} onClick={() => onRowClick && onRowClick(r)}>
                    {columns.map((c) => (
                      <td key={c.key} className={c.align === 'right' ? 'num' : ''} style={{ maxWidth: c.maxWidth }}>
                        {c.render ? c.render(r) : (r[c.key] ?? '—')}
                      </td>
                    ))}
                    {onRowClick && (
                      <td onClick={(e) => { e.stopPropagation(); onRowClick(r); }}>
                        <Eye size={15} style={{ color: 'var(--text-dim)' }} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>{sorted.length} records · page {safePage} of {totalPages}</span>
            <div className="pagination-controls">
              <button className="btn btn-ghost btn-sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={14} />
              </button>
              <button className="btn btn-ghost btn-sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
