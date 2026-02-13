import { useTranslation } from 'react-i18next';
import type { Settlement, Language } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCouple } from '../../hooks/useCouple';
import { formatCurrency } from '../../utils/format';

interface PendingSettlementProps {
  settlement: Settlement;
  onConfirm: () => void;
  onReject: () => void;
}

export default function PendingSettlement({ settlement, onConfirm, onReject }: PendingSettlementProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { partner } = useCouple();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  const requesterName = settlement.requestedBy === profile?.id
    ? profile?.displayName
    : partner?.displayName;

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
      <p className="mb-2 text-sm font-semibold text-amber-800">
        {t('settlement.pendingNotice', { name: requesterName })}
      </p>
      <p className="mb-3 text-center text-xl font-bold text-indigo-600">
        {formatCurrency(settlement.totalAmount, settlement.currency, lang)}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-medium text-white"
        >
          {t('settlement.actions.confirm')}
        </button>
        <button
          onClick={onReject}
          className="flex-1 rounded-xl bg-gray-200 py-2.5 text-sm font-medium text-gray-600"
        >
          {t('settlement.actions.reject')}
        </button>
      </div>
    </div>
  );
}
