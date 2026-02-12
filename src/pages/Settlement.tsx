import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCouple } from '../hooks/useCouple';
import { useAuth } from '../hooks/useAuth';
import { useSettlements } from '../hooks/useSettlements';
import { toDateString } from '../utils/format';
import BalanceSummary from '../components/settlement/BalanceSummary';
import SettlementHistory from '../components/settlement/SettlementHistory';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Settlement() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { transactions, loading: coupleLoading } = useCouple();
  const { settlements, loading: settlementLoading, addSettlement } = useSettlements();
  const [settling, setSettling] = useState(false);

  async function handleSettle() {
    if (!profile) return;
    setSettling(true);
    try {
      const today = toDateString(new Date());
      const lastSettlement = settlements[0];
      const periodStart = lastSettlement ? lastSettlement.periodEnd : '2024-01-01';

      await addSettlement({
        amount: 0, // Placeholder - actual balance will be calculated
        currency: profile.homeCurrency,
        periodStart,
        periodEnd: today,
        memo: '',
      });
    } finally {
      setSettling(false);
    }
  }

  if (coupleLoading || settlementLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('settlement.title')}</h2>

      <BalanceSummary transactions={transactions} />

      <button
        onClick={handleSettle}
        disabled={settling}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {settling ? t('common.loading') : t('settlement.settle')}
      </button>

      <SettlementHistory settlements={settlements} />
    </div>
  );
}
