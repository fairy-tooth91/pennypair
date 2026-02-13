import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCouple } from '../hooks/useCouple';
import { useSettlements } from '../hooks/useSettlements';
import type { SettlementInput } from '../types';
import BalanceSummary from '../components/settlement/BalanceSummary';
import SettlementHistory from '../components/settlement/SettlementHistory';
import SettlementForm from '../components/settlement/SettlementForm';
import PendingSettlement from '../components/settlement/PendingSettlement';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Settlement() {
  const { t } = useTranslation();
  const { transactions, loading: coupleLoading } = useCouple();
  const {
    settlements,
    confirmedItems,
    pendingForMe,
    loading: settlementLoading,
    addSettlement,
    confirmSettlement,
    cancelSettlement,
  } = useSettlements();
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(input: SettlementInput) {
    await addSettlement(input);
    setShowForm(false);
  }

  async function handleConfirm(id: string) {
    if (!confirm(t('settlement.confirmNotice', { amount: '' }))) return;
    await confirmSettlement(id);
  }

  async function handleCancel(id: string) {
    if (!confirm(t('settlement.cancelConfirm'))) return;
    await cancelSettlement(id);
  }

  if (coupleLoading || settlementLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('settlement.title')}</h2>

      {/* 대기 중 정산 알림 (상대방이 요청한 것) */}
      {pendingForMe.map(s => (
        <PendingSettlement
          key={s.id}
          settlement={s}
          onConfirm={() => handleConfirm(s.id)}
          onReject={() => handleCancel(s.id)}
        />
      ))}

      {/* 잔액 요약 */}
      <BalanceSummary transactions={transactions} />

      {/* 정산 요청 버튼 */}
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white"
      >
        {t('settlement.newSettlement')}
      </button>

      {/* 정산 요청 모달 */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={t('settlement.newSettlement')}
      >
        <SettlementForm
          confirmedItems={confirmedItems}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* 정산 기록 */}
      <SettlementHistory
        settlements={settlements}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}
