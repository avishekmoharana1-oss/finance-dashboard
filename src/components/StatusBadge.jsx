export default function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-neutral">—</span>;
  const s = String(status).toLowerCase();
  let cls = 'badge-neutral';
  if (/(success|paid|completed|received|cleared|settled|full)/.test(s)) cls = 'badge-success';
  else if (/(pending|processing|partial|partly|awaiting|initiated|queued)/.test(s)) cls = 'badge-warning';
  else if (/(overdue|failed|reject|bounce|declined|cancel|return|revers)/.test(s)) cls = 'badge-danger';
  else if (/(matched|ok|valid)/.test(s)) cls = 'badge-success';
  else if (/(unmatched|mismatch|invalid|missing)/.test(s)) cls = 'badge-warning';
  return <span className={`badge ${cls}`}>{String(status).charAt(0).toUpperCase() + String(status).slice(1)}</span>;
}
