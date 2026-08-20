import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { DEMO_RTGS, DEMO_BILLING, DEMO_CURRENCY } from '../lib/demoData';
import { buildDataset } from '../lib/parse';
import { RTGS_FIELDS, BILLING_FIELDS } from '../lib/columns';
import { resolvePreset } from '../lib/dates';
import { filterByDateRange } from '../lib/finance';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [rtgsRaw, setRtgsRaw] = useState(null);     // { records, mapping, headers, currency, issues, duplicates }
  const [billingRaw, setBillingRaw] = useState(null);
  const [isDemo, setIsDemo] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Global filters
  const [preset, setPreset] = useState('all');
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [partyFilter, setPartyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const dateRange = useMemo(() => resolvePreset(preset, customStart, customEnd), [preset, customStart, customEnd]);

  // Load demo data on first mount.
  useEffect(() => {
    if (isDemo && !rtgsRaw) {
      const headers = Object.keys(DEMO_RTGS[0]);
      setRtgsRaw({ ...buildDataset(DEMO_RTGS, headers, RTGS_FIELDS, DEMO_CURRENCY), source: 'demo' });
    }
    if (isDemo && !billingRaw) {
      const headers = Object.keys(DEMO_BILLING[0]);
      setBillingRaw({ ...buildDataset(DEMO_BILLING, headers, BILLING_FIELDS, DEMO_CURRENCY), source: 'demo' });
    }
  }, [isDemo, rtgsRaw, billingRaw]);

  const loadRtgs = useCallback((rawRows, headers, currency, source) => {
    setRtgsRaw({ ...buildDataset(rawRows, headers, RTGS_FIELDS, currency), source });
    setIsDemo(source === 'demo');
  }, []);

  const loadBilling = useCallback((rawRows, headers, currency, source) => {
    setBillingRaw({ ...buildDataset(rawRows, headers, BILLING_FIELDS, currency), source });
    setIsDemo(source === 'demo');
  }, []);

  const resetFilters = useCallback(() => {
    setPreset('all'); setCustomStart(null); setCustomEnd(null);
    setPartyFilter('all'); setStatusFilter('all');
    setAmountMin(''); setAmountMax('');
  }, []);

  // Apply global filters to both datasets.
  const filtered = useMemo(() => {
    let rtgs = rtgsRaw?.records || [];
    let billing = billingRaw?.records || [];

    if (dateRange) {
      rtgs = filterByDateRange(rtgs, 'date', dateRange);
      billing = filterByDateRange(billing, 'date', dateRange);
    }
    if (partyFilter !== 'all') {
      const p = partyFilter.toLowerCase();
      rtgs = rtgs.filter((r) => String(r.party || '').toLowerCase().includes(p));
      billing = billing.filter((r) => String(r.party || '').toLowerCase().includes(p));
    }
    if (statusFilter !== 'all') {
      const s = statusFilter.toLowerCase();
      rtgs = rtgs.filter((r) => String(r.status || '').toLowerCase().includes(s));
      billing = billing.filter((r) => String(r.status || '').toLowerCase().includes(s));
    }
    const min = amountMin === '' ? null : Number(amountMin);
    const max = amountMax === '' ? null : Number(amountMax);
    if (min != null) {
      rtgs = rtgs.filter((r) => Number(r.amount) >= min);
      billing = billing.filter((r) => Number(r.amount) >= min);
    }
    if (max != null) {
      rtgs = rtgs.filter((r) => Number(r.amount) <= max);
      billing = billing.filter((r) => Number(r.amount) <= max);
    }
    return { rtgs, billing };
  }, [rtgsRaw, billingRaw, dateRange, partyFilter, statusFilter, amountMin, amountMax]);

  const value = {
    rtgsRaw, billingRaw, isDemo, theme, setTheme,
    loadRtgs, loadBilling, resetFilters,
    preset, setPreset, customStart, setCustomStart, customEnd, setCustomEnd,
    partyFilter, setPartyFilter, statusFilter, setStatusFilter,
    amountMin, setAmountMin, amountMax, setAmountMax,
    filtered, dateRange,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
