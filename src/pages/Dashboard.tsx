import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCouple } from '../hooks/useCouple';
import { useAuth } from '../hooks/useAuth';
import { formatMonth } from '../utils/format';
import { getTodayCelebrations, isCelebrationDismissed, dismissCelebration } from '../utils/milestone';
import type { Language, Milestone } from '../types';
import SummaryCards from '../components/dashboard/SummaryCards';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import AnnualAnalysis from '../components/dashboard/AnnualAnalysis';
import AnniversaryCard from '../components/dashboard/AnniversaryCard';
import CelebrationModal from '../components/dashboard/CelebrationModal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { couple, partner, transactions, selectedMonth, setSelectedMonth, loading } = useCouple();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  const [celebrationMilestones, setCelebrationMilestones] = useState<Milestone[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Check for today's celebrations on mount
  useEffect(() => {
    if (!profile || !couple) return;

    const todayCelebrations = getTodayCelebrations(
      couple.anniversaryDate,
      profile.birthday,
      partner?.birthday ?? null,
      profile.displayName,
      partner?.displayName ?? '',
    );

    const undismissed = todayCelebrations.filter(m => !isCelebrationDismissed(m));
    if (undismissed.length > 0) {
      setCelebrationMilestones(undismissed);
      setShowCelebration(true);
    }
  }, [profile, couple, partner]);

  const handleCelebrationClose = useCallback(() => {
    celebrationMilestones.forEach(m => dismissCelebration(m));
    setShowCelebration(false);
  }, [celebrationMilestones]);

  const handleCelebrationTrigger = useCallback((milestones: Milestone[]) => {
    setCelebrationMilestones(milestones);
    setShowCelebration(true);
  }, []);

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

      {couple && profile && (
        <AnniversaryCard
          anniversaryDate={couple.anniversaryDate}
          myBirthday={profile.birthday}
          partnerBirthday={partner?.birthday ?? null}
          myName={profile.displayName}
          partnerName={partner?.displayName ?? ''}
          onCelebration={handleCelebrationTrigger}
        />
      )}

      <SummaryCards transactions={transactions} />
      <CategoryPieChart transactions={transactions} />
      <MonthlyTrendChart transactions={transactions} />
      <AnnualAnalysis transactions={transactions} />

      {showCelebration && (
        <CelebrationModal
          milestones={celebrationMilestones}
          onClose={handleCelebrationClose}
        />
      )}
    </div>
  );
}
