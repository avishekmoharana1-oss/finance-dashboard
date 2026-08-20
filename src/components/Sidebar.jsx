import { useState } from 'react';
import {
  LayoutDashboard, ArrowRightLeft, FileText, Scale, AlertTriangle,
  Clock, Users, BarChart3, Upload, ShieldCheck, Settings as SettingsIcon,
  Moon, Sun, Menu
} from 'lucide-react';
import { useData } from '../context/DataContext';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'rtgs', label: 'RTGS Transactions', icon: ArrowRightLeft },
  { key: 'billing', label: 'Billing / Invoices', icon: FileText },
  { key: 'reconciliation', label: 'Reconciliation', icon: Scale },
  { key: 'outstanding', label: 'Outstanding', icon: AlertTriangle },
  { key: 'aging', label: 'Aging Analysis', icon: Clock },
  { key: 'customers', label: 'Customers / Vendors', icon: Users },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'import', label: 'Data Import', icon: Upload },
  { key: 'quality', label: 'Data Quality', icon: ShieldCheck },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ current, onNavigate }) {
  const { theme, setTheme } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="logo-icon"><Scale size={20} /></div>
        <div className="brand-text">
          <span className="brand-title">FinOps</span>
          <span className="brand-sub">RTGS & Billing</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <div
              key={n.key}
              className={`nav-item ${current === n.key ? 'active' : ''}`}
              onClick={() => { onNavigate(n.key); setMobileOpen(false); }}
            >
              <Icon size={18} />
              <span>{n.label}</span>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span style={{ marginLeft: 8 }}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <button className="btn btn-ghost" style={{ display: current && window.innerWidth <= 900 ? 'none' : 'none' }} />
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setMobileOpen(true)}
        style={{ position: 'absolute', top: 14, left: 14, zIndex: 30 }}
      >
        <Menu size={18} />
      </button>
      {nav}
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
