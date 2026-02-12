import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, Language } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';

interface SummaryCardsProps {
  transactions: Transaction[];
}

export default function SummaryCards({ transactions }: SummaryCardsProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currency = profile?.homeCurrency ?? 'KRW';
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  const { income, expense } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      const amt = tx.currency === currency
        ? tx.amount
        : tx.convertedCurrency === currency
          ? tx.convertedAmount ?? tx.amount
          : tx.amount;

      if (tx.type === 'income') income += amt;
      else expense += amt;
    }

    return { income, expense };
  }, [transactions, currency]);

  const cards = [
    { key: 'income', value: income, color: 'text-green-600 bg-green-50' },
    { key: 'expense', value: expense, color: 'text-red-600 bg-red-50' },
    { key: 'net', value: income - expense, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map(({ key, value, color }) => (
        <div key={key} className={`rounded-xl p-3 ${color}`}>
          <p className="text-[10px] font-medium opacity-70">{t(`dashboard.${key}`)}</p>
          <p className="mt-1 text-sm font-bold">{formatCurrency(value, currency, lang)}</p>
        </div>
      ))}
    </div>
  );
}
