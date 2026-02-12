import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TransactionInput, TransactionType, SplitType, Currency } from '../../types';
import { CURRENCIES } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { toDateString } from '../../utils/format';

type PaidByOption = 'me' | 'partner';

interface TransactionFormProps {
  onSubmit: (input: TransactionInput) => Promise<void>;
  onCancel: () => void;
  initial?: Partial<TransactionInput>;
}

export default function TransactionForm({ onSubmit, onCancel, initial }: TransactionFormProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { partner, categories } = useCouple();

  const [date, setDate] = useState(initial?.date ?? toDateString(new Date()));
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [paidBy, setPaidBy] = useState<PaidByOption>(
    initial?.paidBy && initial.paidBy !== user?.id ? 'partner' : 'me'
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? profile?.homeCurrency ?? 'KRW');
  const [splitType, setSplitType] = useState<SplitType>(initial?.splitType ?? '50_50');
  const [splitRatio, setSplitRatio] = useState(initial?.splitRatio?.toString() ?? '50');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [submitting, setSubmitting] = useState(false);

  const { rate } = useExchangeRate(currency, currency === 'KRW' ? 'JPY' : 'KRW', date);

  const filteredCategories = categories.filter(c => c.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !categoryId) return;

    setSubmitting(true);
    try {
      const paidById = paidBy === 'me' ? user!.id : partner!.id;
      await onSubmit({
        date,
        type,
        categoryId,
        amount: Number(amount),
        currency,
        splitType,
        splitRatio: Number(splitRatio),
        memo,
        paidBy: paidById,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.date')}</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      {/* Paid by toggle */}
      {partner && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.paidBy')}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaidBy('me')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                paidBy === 'me' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {profile?.displayName} ({t('transaction.me')})
            </button>
            <button
              type="button"
              onClick={() => setPaidBy('partner')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                paidBy === 'partner' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {partner.displayName}
            </button>
          </div>
        </div>
      )}

      {/* Type toggle */}
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map(tp => (
          <button
            key={tp}
            type="button"
            onClick={() => { setType(tp); setCategoryId(''); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              type === tp
                ? tp === 'expense' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {t(`transaction.${tp}`)}
          </button>
        ))}
      </div>

      {/* Category */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.category')}</label>
        <div className="grid grid-cols-4 gap-2">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`flex flex-col items-center rounded-lg py-2 text-xs ${
                categoryId === cat.id ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' : 'bg-gray-50 text-gray-600'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="mt-1">{t(cat.i18nKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount + Currency */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.amount')}</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border px-3 py-2"
            min="0"
            step="any"
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.currency')}</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as Currency)}
            className="w-full rounded-lg border px-3 py-2"
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Exchange rate info */}
      {rate && rate !== 1 && amount && (
        <p className="text-xs text-gray-400">
          ≈ {(Number(amount) * rate).toLocaleString()} {currency === 'KRW' ? 'JPY' : 'KRW'} (rate: {rate.toFixed(4)})
        </p>
      )}

      {/* Split Type */}
      {type === 'expense' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.splitType')}</label>
          <div className="grid grid-cols-2 gap-2">
            {(['50_50', 'custom', 'paid_for_self', 'paid_for_partner'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setSplitType(st);
                  if (st === '50_50') setSplitRatio('50');
                  if (st === 'paid_for_self') setSplitRatio('100');
                  if (st === 'paid_for_partner') setSplitRatio('0');
                }}
                className={`rounded-lg py-2 text-xs font-medium ${
                  splitType === st ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-500'
                }`}
              >
                {t(`split.${st}`)}
              </button>
            ))}
          </div>
          {splitType === 'custom' && (
            <div className="mt-2">
              <label className="text-xs text-gray-500">{t('transaction.splitRatio')} (%)</label>
              <input
                type="number"
                value={splitRatio}
                onChange={e => setSplitRatio(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                min="0"
                max="100"
              />
            </div>
          )}
        </div>
      )}

      {/* Memo */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">{t('transaction.memo')}</label>
        <input
          type="text"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder={t('transaction.memo')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-600"
        >
          {t('transaction.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting || !amount || !categoryId}
          className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('transaction.save')}
        </button>
      </div>
    </form>
  );
}
