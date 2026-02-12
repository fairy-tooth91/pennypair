import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface MonthlyTrendChartProps {
  transactions: Transaction[];
}

export default function MonthlyTrendChart({ transactions }: MonthlyTrendChartProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const currency = profile?.homeCurrency ?? 'KRW';

  const data = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    for (const tx of transactions) {
      const month = tx.date.slice(0, 7);
      const entry = map.get(month) ?? { income: 0, expense: 0 };
      const amt = tx.currency === currency ? tx.amount
        : tx.convertedCurrency === currency ? (tx.convertedAmount ?? tx.amount)
        : tx.amount;

      if (tx.type === 'income') entry.income += amt;
      else entry.expense += amt;
      map.set(month, entry);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({
        month,
        income: Math.round(vals.income),
        expense: Math.round(vals.expense),
      }));
  }, [transactions, currency]);

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('dashboard.monthlyTrend')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
