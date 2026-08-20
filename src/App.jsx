import { useState } from 'react';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import RtgsPage from './pages/RtgsPage';
import BillingPage from './pages/BillingPage';
import ReconciliationPage from './pages/ReconciliationPage';
import OutstandingPage from './pages/OutstandingPage';
import AgingPage from './pages/AgingPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import DataImportPage from './pages/DataImportPage';
import DataQualityPage from './pages/DataQualityPage';
import SettingsPage from './pages/SettingsPage';

const PAGES = {
  dashboard: { title: 'Dashboard', subtitle: 'Financial overview & KPIs', component: Dashboard },
  rtgs: { title: 'RTGS Transactions', subtitle: 'Payment transaction records', component: RtgsPage },
  billing: { title: 'Billing / Invoices', subtitle: 'Invoice and billing records', component: BillingPage },
  reconciliation: { title: 'Reconciliation', subtitle: 'Billing vs RTGS matching', component: ReconciliationPage },
  outstanding: { title: 'Outstanding', subtitle: 'Unpaid and overdue bills', component: OutstandingPage },
  aging: { title: 'Aging Analysis', subtitle: 'Outstanding by age bucket', component: AgingPage },
  customers: { title: 'Customers / Vendors', subtitle: 'Party financial analysis', component: CustomersPage },
  reports: { title: 'Reports', subtitle: 'Export filtered reports', component: ReportsPage },
  import: { title: 'Data Import', subtitle: 'Upload spreadsheets', component: DataImportPage },
  quality: { title: 'Data Quality', subtitle: 'Validation and integrity', component: DataQualityPage },
  settings: { title: 'Settings', subtitle: 'Appearance and data mapping', component: SettingsPage },
};

function App() {
  const [page, setPage] = useState('dashboard');
  const cfg = PAGES[page] || PAGES.dashboard;
  const PageComponent = cfg.component;

  return (
    <DataProvider>
      <div className="app-shell">
        <Sidebar current={page} onNavigate={setPage} />
        <div className="main-area">
          <Topbar title={cfg.title} subtitle={cfg.subtitle} />
          <main className="page-content">
            <PageComponent />
          </main>
        </div>
      </div>
    </DataProvider>
  );
}

export default App;
