import { formatCompactCurrency, formatNumber, formatPercent } from '../lib/format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLORS = {
  primary: 'var(--primary)', success: 'var(--success)', warning: 'var(--warning)',
  danger: 'var(--danger)', info: 'var(--info)', neutral: 'var(--text-muted)',
};

export default function KpiCard({ label, value, count, percent, icon: Icon, tone = 'primary', sub }) {
  const color = COLORS[tone] || COLORS.primary;
  const pct = percent != null && !isNaN(percent);
  const up = pct && percent >= 0;
  return (
    <div className="kpi-card fade-in">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon" style={{ background: `${color}22`, color }}>
          {Icon && <Icon size={18} />}
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">
        {count != null && <span>{formatNumber(count)} records</span>}
        {pct && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: up ? 'var(--success)' : 'var(--danger)' }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {formatPercent(Math.abs(percent))}
          </span>
        )}
        {!pct && sub && <span className="dim">{sub}</span>}
      </div>
    </div>
  );
}
