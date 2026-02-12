import { useCallback } from 'react';
import type { TransactionInput, Currency } from '../types';
import { createTransaction, updateTransaction, deleteTransaction } from '../services/supabase';
import { getExchangeRate, convertAmount } from '../services/exchangeRate';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

export function useTransactions() {
  const { user, profile } = useAuth();
  const { couple, partner, transactions, refreshTransactions, setTransactions } = useCouple();

  const addTransaction = useCallback(async (input: TransactionInput) => {
    if (!user || !couple || !profile || !partner) return;

    const partnerCurrency = partner.homeCurrency ?? profile.homeCurrency;
    let convertedAmt: number | null = null;
    let convertedCur: Currency | null = null;
    let rate: number | null = null;

    if (input.currency !== partnerCurrency) {
      rate = await getExchangeRate(input.currency, partnerCurrency, input.date);
      convertedAmt = convertAmount(input.amount, rate);
      convertedCur = partnerCurrency;
    }

    const newTx = await createTransaction(
      couple.id, user.id, input,
      convertedAmt, convertedCur, rate,
    );

    // Optimistic: prepend
    setTransactions(prev => [newTx, ...prev]);
  }, [user, couple, profile, partner, setTransactions]);

  const editTransaction = useCallback(async (id: string, input: Partial<TransactionInput>) => {
    const updated = await updateTransaction(id, input);
    setTransactions(prev => prev.map(tx => tx.id === id ? updated : tx));
  }, [setTransactions]);

  const removeTransaction = useCallback(async (id: string) => {
    // Optimistic: remove immediately
    const prev = [...transactions];
    setTransactions(txs => txs.filter(tx => tx.id !== id));

    try {
      await deleteTransaction(id);
    } catch {
      setTransactions(prev); // rollback
    }
  }, [transactions, setTransactions]);

  return { transactions, addTransaction, editTransaction, removeTransaction, refreshTransactions };
}
