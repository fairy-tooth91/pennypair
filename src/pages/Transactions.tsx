import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCouple } from '../hooks/useCouple';
import { useTransactions } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { formatMonth } from '../utils/format';
import type { Transaction, Language } from '../types';
import TransactionForm from '../components/transaction/TransactionForm';
import TransactionList from '../components/transaction/TransactionList';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Transactions() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { selectedMonth, setSelectedMonth, loading } = useCouple();
  const { transactions, addTransaction, removeTransaction } = useTransactions();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  function changeMonth(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  async function handleDelete(id: string) {
    if (!confirm(t('transaction.confirmDelete'))) return;
    await removeTransaction(id);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('transaction.title')}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100">←</button>
          <span className="text-sm font-medium">{formatMonth(`${selectedMonth}-01`, lang)}</span>
          <button onClick={() => changeMonth(1)} className="rounded px-2 py-1 text-gray-400 hover:bg-gray-100">→</button>
        </div>
      </div>

      <TransactionList
        transactions={transactions}
        onEdit={tx => { setEditingTx(tx); setShowForm(true); }}
        onDelete={handleDelete}
      />

      {/* FAB - stays within max-w-lg content area on desktop */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-10 mx-auto w-full max-w-lg px-4">
        <button
          onClick={() => { setEditingTx(null); setShowForm(true); }}
          className="pointer-events-auto ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg active:bg-indigo-700"
        >
          +
        </button>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingTx ? t('transaction.edit') : t('transaction.add')}
      >
        <TransactionForm
          initial={editingTx ? {
            date: editingTx.date,
            type: editingTx.type,
            categoryId: editingTx.categoryId,
            amount: editingTx.amount,
            currency: editingTx.currency,
            splitType: editingTx.splitType,
            splitRatio: editingTx.splitRatio,
            memo: editingTx.memo,
          } : undefined}
          onSubmit={async input => {
            await addTransaction(input);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
