import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction, Language } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';

interface AnnualAnalysisProps {
  transactions: Transaction[];
}

export default function AnnualAnalysis({ transactions }: AnnualAnalysisProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currency = profile?.homeCurrency ?? 'KRW';
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  const { totalExpense, avgMonthly, data } = useMemo(() => {
    const monthMap = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const month = tx.date.slice(0, 7);
      const amt = tx.currency === currency ? tx.amount
        : tx.convertedCurrency === currency ? (tx.convertedAmount ?? tx.amount)
        : tx.amount;
      monthMap.set(month, (monthMap.get(month) ?? 0) + amt);
    }

    const data = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month: month.slice(5), value: Math.round(value) }));

    const totalExpense = data.reduce((sum, d) => sum + d.value, 0);
    const avgMonthly = data.length > 0 ? totalExpense / data.length : 0;

    return { totalExpense, avgMonthly, data };
  }, [transactions, currency]);

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('dashboard.annualAnalysis')}</h3>
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        <span>Total: {formatCurrency(totalExpense, currency, lang)}</span>
        <span>Avg/month: {formatCurrency(avgMonthly, currency, lang)}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
