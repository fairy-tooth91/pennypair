import type { Transaction, Currency } from '../types';

interface BalanceResult {
  amount: number;
  currency: Currency;
  oweFrom: string;
  oweTo: string;
}

export function calculateBalance(
  transactions: Transaction[],
  userId: string,
  partnerId: string,
  displayCurrency: Currency,
): BalanceResult {
  let balance = 0;

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;

    let amount: number;
    if (tx.currency === displayCurrency) {
      // 원본 통화가 표시 통화와 같음
      amount = tx.amount;
    } else if (tx.convertedCurrency === displayCurrency && tx.convertedAmount != null) {
      // 변환 통화가 표시 통화와 같음
      amount = tx.convertedAmount;
    } else if (tx.exchangeRate != null && tx.convertedCurrency != null) {
      // 환율 역변환 (convertedCurrency → displayCurrency 방향)
      amount = Math.round(tx.amount / tx.exchangeRate * 100) / 100;
    } else {
      // 변환 불가 - 정산에서 제외
      continue;
    }

    let otherShare: number;

    switch (tx.splitType) {
      case '50_50':
        otherShare = amount * 0.5;
        break;
      case 'custom':
        // splitAmount가 있으면 정확한 금액 기반, 없으면 비율 기반
        if (tx.splitAmount != null) {
          otherShare = amount * (1 - tx.splitAmount / tx.amount);
        } else {
          otherShare = amount * (1 - tx.splitRatio / 100);
        }
        break;
      case 'paid_for_self':
        otherShare = 0;
        break;
      case 'paid_for_partner':
        otherShare = amount;
        break;
    }

    if (tx.paidBy === userId) {
      // 내가 결제 → 상대방 부담분만큼 받을 돈 증가
      balance += otherShare;
    } else {
      // 상대방이 결제 → 내 부담분만큼 갚을 돈 증가
      balance -= otherShare;
    }
  }

  return {
    amount: Math.abs(Math.round(balance)),
    currency: displayCurrency,
    oweFrom: balance < 0 ? userId : partnerId,
    oweTo: balance < 0 ? partnerId : userId,
  };
}
