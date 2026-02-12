import { useTranslation } from 'react-i18next';
import type { Settlement, Language } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { formatCurrency, formatDate } from '../../utils/format';

interface SettlementHistoryProps {
  settlements: Settlement[];
}

export default function SettlementHistory({ settlements }: SettlementHistoryProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { partner } = useCouple();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  if (settlements.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">{t('settlement.noHistory')}</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">{t('settlement.history')}</h3>
      {settlements.map(s => {
        const fromName = s.settledBy === user?.id ? profile?.displayName : partner?.displayName;
        const toName = s.settledTo === user?.id ? profile?.displayName : partner?.displayName;

        return (
          <div key={s.id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {fromName} → {toName}
              </span>
              <span className="text-sm font-bold text-indigo-600">
                {formatCurrency(s.amount, s.currency, lang)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {t('settlement.period')}: {formatDate(s.periodStart, lang)} ~ {formatDate(s.periodEnd, lang)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
