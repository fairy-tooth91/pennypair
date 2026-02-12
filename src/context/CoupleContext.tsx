import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Couple, Profile, Category, Transaction } from '../types';
import { fetchCouple, fetchProfile, fetchCategories, fetchTransactions } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { getCurrentMonth } from '../utils/format';

interface CoupleState {
  couple: Couple | null;
  partner: Profile | null;
  categories: Category[];
  transactions: Transaction[];
  selectedMonth: string;
  loading: boolean;
}

interface CoupleContextValue extends CoupleState {
  setSelectedMonth: (month: string) => void;
  refreshTransactions: () => Promise<void>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [state, setState] = useState<CoupleState>({
    couple: null,
    partner: null,
    categories: [],
    transactions: [],
    selectedMonth: getCurrentMonth(),
    loading: true,
  });

  useEffect(() => {
    if (!user || !profile) {
      setState(prev => ({ ...prev, couple: null, partner: null, categories: [], transactions: [], loading: false }));
      return;
    }

    async function loadCoupleData() {
      try {
        const [couple, categories] = await Promise.all([
          fetchCouple(user!.id),
          fetchCategories(),
        ]);

        let partner: Profile | null = null;
        let transactions: Transaction[] = [];

        if (couple) {
          const partnerId = couple.user1Id === user!.id ? couple.user2Id : couple.user1Id;
          [partner, transactions] = await Promise.all([
            fetchProfile(partnerId),
            fetchTransactions(couple.id, state.selectedMonth),
          ]);
        }

        setState(prev => ({
          ...prev,
          couple,
          partner,
          categories,
          transactions,
          loading: false,
        }));
      } catch {
        setState(prev => ({ ...prev, loading: false }));
      }
    }

    loadCoupleData();
  }, [user, profile]);

  const refreshTransactions = useCallback(async () => {
    if (!state.couple) return;
    const transactions = await fetchTransactions(state.couple.id, state.selectedMonth);
    setState(prev => ({ ...prev, transactions }));
  }, [state.couple, state.selectedMonth]);

  useEffect(() => {
    if (state.couple) {
      refreshTransactions();
    }
  }, [state.selectedMonth]);

  const setSelectedMonth = (month: string) => {
    setState(prev => ({ ...prev, selectedMonth: month }));
  };

  const setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>> = (action) => {
    setState(prev => ({
      ...prev,
      transactions: typeof action === 'function' ? action(prev.transactions) : action,
    }));
  };

  return (
    <CoupleContext.Provider value={{ ...state, setSelectedMonth, refreshTransactions, setTransactions }}>
      {children}
    </CoupleContext.Provider>
  );
}
