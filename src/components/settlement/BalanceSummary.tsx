import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, Language } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { useSettlements } from '../../hooks/useSettlements';
import { calculateBalance } from '../../utils/settlement';
import { formatCurrency } from '../../utils/format';

interface BalanceSummaryProps {
  transactions: Transaction[];
}

export default function BalanceSummary({ transactions }: BalanceSummaryProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { partner } = useCouple();
  const { confirmedItems } = useSettlements();
  const currency = profile?.homeCurrency ?? 'KRW';
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  const balance = useMemo(() => {
    if (!user || !partner) return null;
    return calculateBalance(transactions, confirmedItems, user.id, partner.id, currency);
  }, [transactions, confirmedItems, user, partner, currency]);

  if (!balance || !partner || !profile) return null;

  const isSettled = balance.amount === 0;
  const fromName = balance.oweFrom === user?.id ? profile.displayName : partner.displayName;
  const toName = balance.oweTo === user?.id ? profile.displayName : partner.displayName;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('settlement.balance')}</h3>
      {isSettled ? (
        <p className="text-center text-lg font-bold text-green-500">{t('settlement.settled')}</p>
      ) : (
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {formatCurrency(balance.amount, balance.currency, lang)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {t('settlement.owes', { from: fromName, to: toName })}
          </p>
        </div>
      )}
    </div>
  );
}
