import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';

const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

interface CategoryPieChartProps {
  transactions: Transaction[];
}

export default function CategoryPieChart({ transactions }: CategoryPieChartProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { categories } = useCouple();
  const currency = profile?.homeCurrency ?? 'KRW';

  const data = useMemo(() => {
    const map = new Map<string, number>();
    const expenses = transactions.filter(tx => tx.type === 'expense');

    for (const tx of expenses) {
      const amt = tx.currency === currency ? tx.amount
        : tx.convertedCurrency === currency ? (tx.convertedAmount ?? tx.amount)
        : tx.amount;

      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + amt);
    }

    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

    return Array.from(map.entries())
      .map(([catId, value]) => ({
        name: categoryMap[catId] ? t(categoryMap[catId].i18nKey) : catId,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, currency, t]);

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('dashboard.categoryBreakdown')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
