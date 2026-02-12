import { useTranslation } from 'react-i18next';
import { useCouple } from '../hooks/useCouple';
import { formatMonth } from '../utils/format';
import type { Language } from '../types';
import { useAuth } from '../hooks/useAuth';
import SummaryCards from '../components/dashboard/SummaryCards';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import AnnualAnalysis from '../components/dashboard/AnnualAnalysis';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { transactions, selectedMonth, setSelectedMonth, loading } = useCouple();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  if (loading) return <LoadingSpinner />;

  function changeMonth(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('dashboard.title')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100">←</button>
          <span className="text-sm font-medium">{formatMonth(`${selectedMonth}-01`, lang)}</span>
          <button onClick={() => changeMonth(1)} className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100">→</button>
        </div>
      </div>

      <SummaryCards transactions={transactions} />
      <CategoryPieChart transactions={transactions} />
      <MonthlyTrendChart transactions={transactions} />
      <AnnualAnalysis transactions={transactions} />
    </div>
  );
}
