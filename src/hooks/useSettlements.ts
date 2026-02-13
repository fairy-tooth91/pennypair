import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Settlement, SettlementItem, SettlementInput } from '../types';
import {
  fetchSettlements,
  fetchConfirmedItems,
  fetchItemsBySettlement,
  createSettlement as createSettlementService,
  confirmSettlement as confirmSettlementService,
  cancelSettlement as cancelSettlementService,
} from '../services/supabase';
import { useAuth } from './useAuth';
import { useCouple } from './useCouple';

export function useSettlements() {
  const { user } = useAuth();
  const { couple, partner } = useCouple();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [confirmedItems, setConfirmedItems] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 로딩: settlements + confirmedItems 병렬
  useEffect(() => {
    if (!couple) {
      setSettlements([]);
      setConfirmedItems([]);
      setLoading(false);
      return;
    }

    Promise.all([
      fetchSettlements(couple.id),
      fetchConfirmedItems(couple.id),
    ])
      .then(([s, items]) => {
        setSettlements(s);
        setConfirmedItems(items);
      })
      .finally(() => setLoading(false));
  }, [couple]);

  // 파생 값: 대기 중 정산
  const pendingForMe = useMemo(
    () => settlements.filter(s => s.status === 'pending' && s.requestedTo === user?.id),
    [settlements, user],
  );

  const pendingByMe = useMemo(
    () => settlements.filter(s => s.status === 'pending' && s.requestedBy === user?.id),
    [settlements, user],
  );

  // confirmedItems 새로고침
  const refreshConfirmedItems = useCallback(async () => {
    if (!couple) return;
    const items = await fetchConfirmedItems(couple.id);
    setConfirmedItems(items);
  }, [couple]);

  // 정산 요청
  const addSettlement = useCallback(async (input: SettlementInput) => {
    if (!user || !couple || !partner) return;
    const { settlement } = await createSettlementService(
      couple.id, user.id, partner.id, input,
    );
    setSettlements(prev => [settlement, ...prev]);
  }, [user, couple, partner]);

  // 정산 확인 (상대방)
  const handleConfirm = useCallback(async (id: string) => {
    const updated = await confirmSettlementService(id);
    setSettlements(prev => prev.map(s => s.id === id ? updated : s));
    await refreshConfirmedItems();
  }, [refreshConfirmedItems]);

  // 정산 취소
  const handleCancel = useCallback(async (id: string) => {
    if (!user) return;
    const updated = await cancelSettlementService(id, user.id);
    setSettlements(prev => prev.map(s => s.id === id ? updated : s));
    await refreshConfirmedItems();
  }, [user, refreshConfirmedItems]);

  // 특정 settlement의 items 조회
  const getItems = useCallback(async (settlementId: string) => {
    return fetchItemsBySettlement(settlementId);
  }, []);

  return {
    settlements,
    confirmedItems,
    pendingForMe,
    pendingByMe,
    loading,
    addSettlement,
    confirmSettlement: handleConfirm,
    cancelSettlement: handleCancel,
    getItems,
  };
}
