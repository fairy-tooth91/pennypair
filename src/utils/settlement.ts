import type { Transaction, SettlementItem, Currency } from '../types';

interface BalanceResult {
  amount: number;
  currency: Currency;
  oweFrom: string;
  oweTo: string;
}

export interface UnsettledTransaction {
  transaction: Transaction;
  otherShare: number;
  settledAmount: number;
  remaining: number;
  displayCurrency: Currency;
}

// 거래 금액을 displayCurrency로 변환
function getAmountInDisplay(tx: Transaction, displayCurrency: Currency): number | null {
  if (tx.currency === displayCurrency) {
    return tx.amount;
  } else if (tx.convertedCurrency === displayCurrency && tx.convertedAmount != null) {
    return tx.convertedAmount;
  } else if (tx.exchangeRate != null && tx.convertedCurrency != null) {
    return Math.round(tx.amount / tx.exchangeRate * 100) / 100;
  }
  return null;
}

// 상대방 몫 계산 (displayCurrency 기준 금액에서)
function getOtherShare(tx: Transaction, amountInDisplay: number): number {
  switch (tx.splitType) {
    case '50_50':
      return amountInDisplay * 0.5;
    case 'custom':
      if (tx.splitAmount != null) {
        return amountInDisplay * (1 - tx.splitAmount / tx.amount);
      }
      return amountInDisplay * (1 - tx.splitRatio / 100);
    case 'paid_for_self':
      return 0;
    case 'paid_for_partner':
      return amountInDisplay;
  }
}

// 기정산 금액(원본 통화)을 displayCurrency로 변환
function settledToDisplay(settledOriginal: number, tx: Transaction, displayCurrency: Currency): number {
  if (settledOriginal <= 0 || tx.amount <= 0) return 0;

  if (tx.currency === displayCurrency) {
    return settledOriginal;
  } else if (tx.convertedCurrency === displayCurrency && tx.convertedAmount != null) {
    return settledOriginal * (tx.convertedAmount / tx.amount);
  } else if (tx.exchangeRate != null) {
    return settledOriginal / tx.exchangeRate;
  }
  return settledOriginal;
}

// 거래별 기정산 합계 Map 생성 (원본 통화 기준)
function buildSettledMap(confirmedItems: SettlementItem[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of confirmedItems) {
    map.set(item.transactionId, (map.get(item.transactionId) ?? 0) + item.amount);
  }
  return map;
}

// 잔액 계산: confirmed settlement_items 반영
export function calculateBalance(
  transactions: Transaction[],
  confirmedItems: SettlementItem[],
  userId: string,
  partnerId: string,
  displayCurrency: Currency,
): BalanceResult {
  const settledByTxId = buildSettledMap(confirmedItems);
  let balance = 0;

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;

    const amountInDisplay = getAmountInDisplay(tx, displayCurrency);
    if (amountInDisplay == null) continue;

    const otherShare = getOtherShare(tx, amountInDisplay);
    const settledOriginal = settledByTxId.get(tx.id) ?? 0;
    const settledInDisplay = settledToDisplay(settledOriginal, tx, displayCurrency);
    const remaining = Math.max(0, otherShare - settledInDisplay);

    if (tx.paidBy === userId) {
      balance += remaining;
    } else {
      balance -= remaining;
    }
  }

  return {
    amount: Math.abs(Math.round(balance)),
    currency: displayCurrency,
    oweFrom: balance < 0 ? userId : partnerId,
    oweTo: balance < 0 ? partnerId : userId,
  };
}

// 미정산 거래 목록 + 잔여 금액 (SettlementForm에서 사용)
export function getUnsettledTransactions(
  transactions: Transaction[],
  confirmedItems: SettlementItem[],
  _userId: string,
  _partnerId: string,
  displayCurrency: Currency,
): UnsettledTransaction[] {
  const settledByTxId = buildSettledMap(confirmedItems);
  const result: UnsettledTransaction[] = [];

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (tx.splitType === 'paid_for_self') continue;

    const amountInDisplay = getAmountInDisplay(tx, displayCurrency);
    if (amountInDisplay == null) continue;

    const otherShare = getOtherShare(tx, amountInDisplay);
    if (otherShare <= 0) continue;

    const settledOriginal = settledByTxId.get(tx.id) ?? 0;
    const settledInDisplay = settledToDisplay(settledOriginal, tx, displayCurrency);
    const remaining = Math.max(0, otherShare - settledInDisplay);

    if (remaining > 0) {
      result.push({
        transaction: tx,
        otherShare: Math.round(otherShare),
        settledAmount: Math.round(settledInDisplay),
        remaining: Math.round(remaining),
        displayCurrency,
      });
    }
  }

  return result;
}
