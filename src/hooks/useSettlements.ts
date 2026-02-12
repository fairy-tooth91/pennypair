import { useState, useEffect, useCallback } from 'react';
import type { Settlement, SettlementInput } from '../types';
import { fetchSettlements, createSettlement } from '../services/supabase';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

export function useSettlements() {
  const { user } = useAuth();
  const { couple, partner } = useCouple();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!couple) {
      setSettlements([]);
      setLoading(false);
      return;
    }

    fetchSettlements(couple.id)
      .then(setSettlements)
      .finally(() => setLoading(false));
  }, [couple]);

  const addSettlement = useCallback(async (input: SettlementInput) => {
    if (!user || !couple || !partner) return;

    const settlement = await createSettlement(
      couple.id,
      user.id,
      partner.id,
      input,
    );

    setSettlements(prev => [settlement, ...prev]);
  }, [user, couple, partner]);

  return { settlements, loading, addSettlement };
}
