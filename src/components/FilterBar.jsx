import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DATE_PRESETS } from '../lib/dates';
import { RotateCcw, Filter } from 'lucide-react';

export default function FilterBar() {
  const {
    preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd,
    partyFilter, setPartyFilter, statusFilter, setStatusFilter,
    amountMin, setAmountMin, amountMax, setAmountMax, resetFilters,
    rtgsRaw, billingRaw,
  } = useData();

  const parties = useMemo(() => {
    const set = new Set();
    (rtgsRaw?.records || []).forEach((r) => r.party && set.add(String(r.party)));
    (billingRaw?.records || []).forEach((r) => r.party && set.add(String(r.party)));
    return [...set].sort();
  }, [rtgsRaw, billingRaw]);

  const statuses = useMemo(() => {
    const set = new Set();
    (rtgsRaw?.records || []).forEach((r) => r.status && set.add(String(r.status)));
    (billingRaw?.records || []).forEach((r) => r.status && set.add(String(r.status)));
    return [...set].sort();
  }, [rtgsRaw, billingRaw]);

  return (
    <div className="filter-bar fade-in">
      <div className="filter-group">
        <Filter size={14} className="dim" />
        <span className="filter-label">Date:</span>
        <select className="select" value={preset} onChange={(e) => setPreset(e.target.value)}>
          {DATE_PRESETS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        {preset === 'custom' && (
          <>
            <input type="date" className="input" value={customStart ? customStart.toISOString().slice(0, 10) : ''} onChange={(e) => setCustomStart(e.target.value ? new Date(e.target.value) : null)} />
            <span className="dim">to</span>
            <input type="date" className="input" value={customEnd ? customEnd.toISOString().slice(0, 10) : ''} onChange={(e) => setCustomEnd(e.target.value ? new Date(e.target.value) : null)} />
          </>
        )}
      </div>
      <div className="filter-group">
        <span className="filter-label">Party:</span>
        <select className="select" value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}>
          <option value="all">All</option>
          {parties.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <span className="filter-label">Status:</span>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <span className="filter-label">Amount:</span>
        <input type="number" className="input" style={{ width: 90 }} placeholder="Min" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
        <span className="dim">to</span>
        <input type="number" className="input" style={{ width: 90 }} placeholder="Max" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-sm btn-ghost" onClick={resetFilters}>
        <RotateCcw size={14} /> Reset
      </button>
    </div>
  );
}
