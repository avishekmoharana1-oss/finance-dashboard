import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];
const TOOLTIP_STYLE = {
  background: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 12,
};

function fmtMoney(v) {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

export function BarChartCard({ data, xKey, yKey, label, color = '#3b82f6', height = 280, currency }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border)" />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border)" tickFormatter={fmtMoney} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-hover)' }} formatter={(v) => [currency ? `${currency} ${Number(v).toLocaleString()}` : v, label]} />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineChartCard({ data, xKey, yKey, label, color = '#3b82f6', height = 280, currency }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border)" />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border)" tickFormatter={fmtMoney} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [currency ? `${currency} ${Number(v).toLocaleString()}` : v, label]} />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBarChart({ data, height = 300, currency }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border)" />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--border)" tickFormatter={fmtMoney} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-hover)' }} formatter={(v) => currency ? `${currency} ${Number(v).toLocaleString()}` : v} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {Object.keys(data[0] || {}).filter((k) => k !== 'name').map((k, i) => (
          <Bar key={k} dataKey={k} fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} maxBarSize={45} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 280, currency }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [currency ? `${currency} ${Number(v).toLocaleString()}` : v, n]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
