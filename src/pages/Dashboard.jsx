import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { computeKpis, buildTrend, normalizeRtgsStatus, classifyBill } from '../lib/finance';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import KpiCard from '../components/KpiCard';
import FilterBar from '../components/FilterBar';
import { BarChartCard, LineChartCard, DonutChart, ComparisonBarChart } from '../components/Charts';
import {
  Wallet, ArrowRightLeft, FileText, TrendingUp, AlertTriangle,
  CheckCircle, Clock, XCircle, DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const { filtered, rtgsRaw, billingRaw, isDemo } = useData();
  const { rtgs, billing } = filtered;
  const currency = rtgsRaw?.currency || billingRaw?.currency || '';

  const kpis = useMemo(() => computeKpis(rtgs, billing), [rtgs, billing]);

  const billingTrend = useMemo(() => buildTrend(billing, 'date', 'amount', 'day'), [billing]);
  const rtgsTrend = useMemo(() => buildTrend(rtgs, 'date', 'amount', 'day'), [rtgs]);
  const billingMonthly = useMemo(() => buildTrend(billing, 'date', 'amount', 'month'), [billing]);

  const statusDist = useMemo(() => {
    const m = {};
    rtgs.forEach((r) => { const s = normalizeRtgsStatus(r.status); m[s] = (m[s] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [rtgs]);

  const billStatusDist = useMemo(() => {
    const m = {};
    billing.forEach((r) => { const s = classifyBill(r); m[s] = (m[s] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [billing]);

  const comparison = useMemo(() => {
    const totalRtgs = kpis.totalRtgs;
    const totalBilled = kpis.totalBilling;
    const totalReceived = kpis.totalReceived;
    const outstanding = kpis.totalOutstanding;
    return [
      { name: 'Billed', Billed: totalBilled },
      { name: 'RTGS', RTGS: totalRtgs },
      { name: 'Received', Received: totalReceived },
      { name: 'Outstanding', Outstanding: outstanding },
    ];
  }, [kpis]);

  const hasNoData = rtgs.length === 0 && billing.length === 0;

  return (
    <div className="fade-in">
      <FilterBar />

      {hasNoData && (
        <div className="card mb-4" style={{ borderColor: 'var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <span>No records match the current filters. Try resetting filters or uploading data.</span>
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard label="Total Billing" value={formatCurrency(kpis.totalBilling, currency)} count={kpis.billingCount} icon={FileText} tone="primary" sub="Total invoiced amount" />
        <KpiCard label="Total RTGS" value={formatCurrency(kpis.totalRtgs, currency)} count={kpis.rtgsCount} icon={ArrowRightLeft} tone="info" sub="Total RTGS volume" />
        <KpiCard label="Amount Received" value={formatCurrency(kpis.totalReceived, currency)} icon={TrendingUp} tone="success"
          percent={kpis.collectionPct != null ? kpis.collectionPct : null} sub="Collected from bills + successful RTGS" />
        <KpiCard label="Outstanding" value={formatCurrency(kpis.totalOutstanding, currency)} icon={Wallet} tone="warning" sub="Unpaid billing amount" />
        <KpiCard label="Paid Bills" value={formatNumber(kpis.paidBills)} icon={CheckCircle} tone="success" sub={`of ${kpis.billingCount} bills`} />
        <KpiCard label="Overdue Bills" value={formatNumber(kpis.overdueBills)} icon={AlertTriangle} tone="danger" sub="Past due date" />
        <KpiCard label="Successful RTGS" value={formatNumber(kpis.successfulRtgs)} icon={CheckCircle} tone="success" sub={`of ${kpis.rtgsCount} transactions`} />
        <KpiCard label="Failed RTGS" value={formatNumber(kpis.failedRtgs)} icon={XCircle} tone="danger" sub="Failed / rejected" />
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Billing vs RTGS vs Received</h3>
              <p className="card-desc">Financial comparison across all sources</p>
            </div>
          </div>
          <ComparisonBarChart data={comparison} currency={currency} />
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Payment Collection</h3>
              <p className="card-desc">Billing status distribution</p>
            </div>
          </div>
          {billStatusDist.length ? <DonutChart data={billStatusDist} currency={currency} /> : <div className="dim" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No billing data</div>}
        </div>
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Daily Billing Trend</h3>
              <p className="card-desc">Billed amount over time</p>
            </div>
          </div>
          {billingTrend.length ? <LineChartCard data={billingTrend} xKey="key" yKey="value" label="Billed" color="#3b82f6" currency={currency} /> : <div className="dim" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No billing dates available</div>}
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Daily RTGS Trend</h3>
              <p className="card-desc">Payment volume over time</p>
            </div>
          </div>
          {rtgsTrend.length ? <LineChartCard data={rtgsTrend} xKey="key" yKey="value" label="RTGS" color="#10b981" currency={currency} /> : <div className="dim" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No RTGS dates available</div>}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">RTGS Status Distribution</h3>
              <p className="card-desc">Transaction outcomes</p>
            </div>
          </div>
          {statusDist.length ? <DonutChart data={statusDist} /> : <div className="dim" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No RTGS data</div>}
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Monthly Billing Trend</h3>
              <p className="card-desc">Aggregated by month</p>
            </div>
          </div>
          {billingMonthly.length ? <BarChartCard data={billingMonthly} xKey="key" yKey="value" label="Billed" color="#06b6d4" currency={currency} /> : <div className="dim" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No billing dates available</div>}
        </div>
      </div>

      {isDemo && (
        <div className="card mt-4" style={{ borderColor: 'var(--warning)', background: 'var(--warning-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--warning)' }}>
            <AlertTriangle size={16} />
            <span style={{ fontWeight: 600 }}>You are viewing DEMO DATA.</span>
            <span style={{ color: 'var(--text-muted)' }}>Upload your real RTGS and Billing files from the Data Import page to replace this.</span>
          </div>
        </div>
      )}
    </div>
  );
}
