import { useData } from '../context/DataContext';
import { Moon, Sun, TrendingUp } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const { theme, setTheme, isDemo } = useData();
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="dim" style={{ fontSize: 12 }}>{subtitle}</div>}
        </div>
        {isDemo && <span className="demo-badge">DEMO DATA</span>}
      </div>
      <div className="topbar-right">
        <div className="flex" style={{ alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: 12 }}>
          <TrendingUp size={14} />
          <span>Live</span>
        </div>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
          FA
        </div>
      </div>
    </header>
  );
}
