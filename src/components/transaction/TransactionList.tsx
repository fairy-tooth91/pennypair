import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { formatCurrency, formatDate } from '../../utils/format';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        const otherName = isOwn ? partner?.displayName : profile?.displayName;
        const isExpanded = expandedId === tx.id;

        return (
          <div key={tx.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div
              className="flex items-center gap-3 p-3"
              onClick={() => setExpandedId(isExpanded ? null : tx.id)}
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
                {tx.type === 'expense' && (
                  <p className="text-[10px] text-gray-300">{t(`split.${tx.splitType}`)}</p>
                )}
              </div>
            </div>
            {isExpanded && (
              <>
                <div className="border-t border-gray-100 px-4 py-3 space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('transaction.paidBy')}</span>
                    <span>{payerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('transaction.date')}</span>
                    <span>{formatDate(tx.date, lang)}</span>
                  </div>
                  {tx.type === 'expense' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('transaction.splitType')}</span>
                      <span>{t(`split.${tx.splitType}`)}</span>
                    </div>
                  )}
                  {tx.type === 'expense' && tx.splitType === 'custom' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('transaction.splitRatio')}</span>
                      {tx.splitAmount != null ? (
                        <span>
                          {payerName} {formatCurrency(tx.splitAmount, tx.currency, lang)}
                          {' / '}
                          {otherName} {formatCurrency(tx.amount - tx.splitAmount, tx.currency, lang)}
                        </span>
                      ) : (
                        <span>
                          {payerName} {tx.splitRatio}%
                          {' / '}
                          {otherName} {100 - tx.splitRatio}%
                        </span>
                      )}
                    </div>
                  )}
                  {tx.convertedAmount != null && tx.convertedCurrency && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('transaction.convertedAmount')}</span>
                      <span>{formatCurrency(tx.convertedAmount, tx.convertedCurrency, lang)}</span>
                    </div>
                  )}
                  {tx.exchangeRate != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('transaction.exchangeRate')}</span>
                      <span>{tx.exchangeRate}</span>
                    </div>
                  )}
                  {tx.memo && (
                    <div className="flex justify-between gap-4">
                      <span className="shrink-0 text-gray-400">{t('transaction.memo')}</span>
                      <span className="text-right">{tx.memo}</span>
                    </div>
                  )}
                </div>
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => { setExpandedId(null); onEdit(tx); }}
                    className="flex-1 py-2 text-xs font-medium text-indigo-600 active:bg-indigo-50"
                  >
                    {t('transaction.edit')}
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => { setExpandedId(null); onDelete(tx.id); }}
                    className="flex-1 py-2 text-xs font-medium text-red-500 active:bg-red-50"
                  >
                    {t('transaction.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
