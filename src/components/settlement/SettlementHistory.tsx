import { useTranslation } from 'react-i18next';
import type { Settlement, Language } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { formatCurrency, formatDate } from '../../utils/format';

interface SettlementHistoryProps {
  settlements: Settlement[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
} as const;

export default function SettlementHistory({ settlements, onConfirm, onCancel }: SettlementHistoryProps) {
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
        const fromName = s.requestedBy === user?.id ? profile?.displayName : partner?.displayName;
        const toName = s.requestedTo === user?.id ? profile?.displayName : partner?.displayName;
        const isPendingForMe = s.status === 'pending' && s.requestedTo === user?.id;
        const isPendingByMe = s.status === 'pending' && s.requestedBy === user?.id;

        return (
          <div key={s.id} className={`rounded-xl bg-white p-3 shadow-sm ${s.status === 'cancelled' ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {fromName} → {toName}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                  {t(`settlement.status.${s.status}`)}
                </span>
              </div>
              <span className="text-sm font-bold text-indigo-600">
                {formatCurrency(s.totalAmount, s.currency, lang)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {t('settlement.period')}: {formatDate(s.periodStart, lang)} ~ {formatDate(s.periodEnd, lang)}
            </p>

            {isPendingForMe && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onConfirm(s.id)}
                  className="flex-1 rounded-lg bg-green-500 py-1.5 text-xs font-medium text-white"
                >
                  {t('settlement.actions.confirm')}
                </button>
                <button
                  onClick={() => onCancel(s.id)}
                  className="flex-1 rounded-lg bg-gray-200 py-1.5 text-xs font-medium text-gray-600"
                >
                  {t('settlement.actions.reject')}
                </button>
              </div>
            )}
            {isPendingByMe && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-amber-600">{t('settlement.waitingForPartner')}</span>
                <button
                  onClick={() => onCancel(s.id)}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
            {s.status === 'confirmed' && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => {
                    if (confirm(t('settlement.cancelConfirm'))) onCancel(s.id);
                  }}
                  className="text-xs text-gray-400 underline"
                >
                  {t('settlement.actions.cancel')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
