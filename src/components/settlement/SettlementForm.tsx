import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, SettlementInput, SettlementItem, Language, Currency } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { fetchTransactions } from '../../services/supabase';
import { getUnsettledTransactions } from '../../utils/settlement';
import { formatCurrency, formatDate, getCurrentMonth, toDateString } from '../../utils/format';

interface SettlementFormProps {
  confirmedItems: SettlementItem[];
  onSubmit: (input: SettlementInput) => Promise<void>;
  onCancel: () => void;
}

type TabMode = 'monthly' | 'perTransaction';

export default function SettlementForm({ confirmedItems, onSubmit, onCancel }: SettlementFormProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { couple, partner } = useCouple();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;
  const currency = profile?.homeCurrency ?? 'KRW';

  const [tab, setTab] = useState<TabMode>('perTransaction');
  const [month, setMonth] = useState(getCurrentMonth());
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Map<string, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);

  // 전체 거래 로딩 (건당 정산용)
  useEffect(() => {
    if (!couple) return;
    setLoadingTx(true);
    fetchTransactions(couple.id)
      .then(setAllTransactions)
      .finally(() => setLoadingTx(false));
  }, [couple]);

  // 월별 거래 로딩 (월 정산용)
  useEffect(() => {
    if (!couple || tab !== 'monthly') return;
    fetchTransactions(couple.id, month).then(setMonthTransactions);
  }, [couple, month, tab]);

  // 미정산 거래 계산
  const unsettledAll = useMemo(() => {
    if (!user || !partner) return [];
    return getUnsettledTransactions(allTransactions, confirmedItems, user.id, partner.id, currency);
  }, [allTransactions, confirmedItems, user, partner, currency]);

  const unsettledMonth = useMemo(() => {
    if (!user || !partner) return [];
    return getUnsettledTransactions(monthTransactions, confirmedItems, user.id, partner.id, currency);
  }, [monthTransactions, confirmedItems, user, partner, currency]);

  const unsettled = tab === 'monthly' ? unsettledMonth : unsettledAll;

  // 월 정산: 전체 선택
  useEffect(() => {
    if (tab === 'monthly') {
      setSelectedIds(new Set(unsettledMonth.map(u => u.transaction.id)));
      setCustomAmounts(new Map());
    }
  }, [tab, unsettledMonth]);

  // 선택된 거래의 합계
  const totalAmount = useMemo(() => {
    let sum = 0;
    for (const u of unsettled) {
      if (!selectedIds.has(u.transaction.id)) continue;
      const amount = customAmounts.get(u.transaction.id) ?? u.remaining;
      sum += amount;
    }
    return sum;
  }, [unsettled, selectedIds, customAmounts]);

  function toggleSelect(txId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  }

  function setAmount(txId: string, amount: number) {
    setCustomAmounts(prev => new Map(prev).set(txId, amount));
  }

  async function handleSubmit() {
    if (!user || !partner || totalAmount <= 0) return;
    setSubmitting(true);
    try {
      const items = unsettled
        .filter(u => selectedIds.has(u.transaction.id))
        .map(u => {
          const displayAmount = customAmounts.get(u.transaction.id) ?? u.remaining;
          // displayCurrency → 거래 원본 통화로 역변환
          const tx = u.transaction;
          let originalAmount: number;
          if (tx.currency === currency) {
            originalAmount = displayAmount;
          } else if (tx.convertedCurrency === currency && tx.convertedAmount != null && tx.convertedAmount > 0) {
            originalAmount = displayAmount * (tx.amount / tx.convertedAmount);
          } else {
            originalAmount = displayAmount;
          }
          return {
            transactionId: tx.id,
            amount: Math.round(originalAmount * 100) / 100,
            currency: tx.currency as Currency,
          };
        });

      const dates = unsettled
        .filter(u => selectedIds.has(u.transaction.id))
        .map(u => u.transaction.date)
        .sort();

      const input: SettlementInput = {
        type: tab === 'monthly' ? 'monthly' : 'per_transaction',
        totalAmount: Math.round(totalAmount),
        currency,
        periodStart: dates[0] ?? toDateString(new Date()),
        periodEnd: dates[dates.length - 1] ?? toDateString(new Date()),
        memo: '',
        items,
      };

      await onSubmit(input);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          className={`flex-1 rounded-md py-2 text-sm font-medium ${tab === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          onClick={() => setTab('monthly')}
        >
          {t('settlement.monthly')}
        </button>
        <button
          className={`flex-1 rounded-md py-2 text-sm font-medium ${tab === 'perTransaction' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
          onClick={() => setTab('perTransaction')}
        >
          {t('settlement.perTransaction')}
        </button>
      </div>

      {/* 월 선택 (월 정산 탭만) */}
      {tab === 'monthly' && (
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      )}

      {/* 미정산 거래 목록 */}
      {loadingTx ? (
        <p className="text-center text-sm text-gray-400">{t('common.loading')}</p>
      ) : unsettled.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">{t('settlement.noUnsettled')}</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {unsettled.map(u => {
            const tx = u.transaction;
            const isSelected = selectedIds.has(tx.id);
            const payer = tx.paidBy === user?.id ? profile?.displayName : partner?.displayName;

            return (
              <div
                key={tx.id}
                className={`rounded-lg border p-3 ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-2">
                  {tab === 'perTransaction' && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(tx.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatDate(tx.date, lang)}</span>
                      <span className="text-sm text-gray-500">{payer}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{tx.memo || t(`split.${tx.splitType}`)}</span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(u.remaining, currency, lang)}
                      </span>
                    </div>
                    {u.settledAmount > 0 && (
                      <p className="text-xs text-green-600">
                        {t('settlement.settledOf', {
                          settled: formatCurrency(u.settledAmount, currency, lang),
                          total: formatCurrency(u.otherShare, currency, lang),
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* 일부 금액 입력 (건당 정산 + 선택된 경우만) */}
                {tab === 'perTransaction' && isSelected && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">{t('settlement.partialAmount')}:</span>
                    <input
                      type="number"
                      value={customAmounts.get(tx.id) ?? u.remaining}
                      onChange={e => {
                        const val = Math.min(Number(e.target.value) || 0, u.remaining);
                        setAmount(tx.id, val);
                      }}
                      className="w-24 rounded border border-gray-200 px-2 py-1 text-right text-sm"
                      min={0}
                      max={u.remaining}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 합계 */}
      {totalAmount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">{t('settlement.totalAmount')}</span>
          <span className="text-lg font-bold text-indigo-600">
            {formatCurrency(totalAmount, currency, lang)}
          </span>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl bg-gray-200 py-3 text-sm font-medium text-gray-600"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || totalAmount <= 0}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('settlement.requestSettlement')}
        </button>
      </div>
    </div>
  );
}
