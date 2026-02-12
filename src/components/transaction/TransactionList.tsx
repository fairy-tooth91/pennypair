import { useTranslation } from 'react-i18next';
import type { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { formatDate } from '../../utils/format';
import CurrencyDisplay from '../common/CurrencyDisplay';
import type { Language } from '../../types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { categories, partner } = useCouple();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">{t('transaction.noTransactions')}</p>;
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

  return (
    <div className="space-y-2">
      {transactions.map(tx => {
        const cat = categoryMap[tx.categoryId];
        const isOwn = tx.paidBy === user?.id;
        const payerName = isOwn ? profile?.displayName : partner?.displayName;

        return (
          <div
            key={tx.id}
            className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
            onClick={() => isOwn && onEdit(tx)}
          >
            <span className="text-2xl">{cat?.icon ?? '📦'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{cat ? t(cat.i18nKey) : ''}</span>
                <span className="text-xs text-gray-400">· {payerName}</span>
              </div>
              <p className="truncate text-xs text-gray-400">
                {formatDate(tx.date, lang)}
                {tx.memo && ` · ${tx.memo}`}
              </p>
            </div>
            <div className="text-right">
              <CurrencyDisplay
                amount={tx.amount}
                currency={tx.currency}
                convertedAmount={tx.convertedAmount}
                convertedCurrency={tx.convertedCurrency}
                className={`text-sm ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}
              />
              <p className="text-[10px] text-gray-300">{t(`split.${tx.splitType}`)}</p>
            </div>
            {isOwn && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(tx.id); }}
                className="text-xs text-gray-300 hover:text-red-400"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
