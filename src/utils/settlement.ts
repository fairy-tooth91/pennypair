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

    const amount = tx.currency === displayCurrency
      ? tx.amount
      : tx.convertedCurrency === displayCurrency
        ? tx.convertedAmount ?? tx.amount
        : tx.amount;

    let payerShare: number;
    let otherShare: number;

    switch (tx.splitType) {
      case '50_50':
        payerShare = amount * 0.5;
        otherShare = amount * 0.5;
        break;
      case 'custom':
        payerShare = amount * (tx.splitRatio / 100);
        otherShare = amount * (1 - tx.splitRatio / 100);
        break;
      case 'paid_for_self':
        payerShare = amount;
        otherShare = 0;
        break;
      case 'paid_for_partner':
        payerShare = 0;
        otherShare = amount;
        break;
    }

    if (tx.paidBy === userId) {
      balance += otherShare;
    } else {
      balance -= payerShare;
    }
  }

  return {
    amount: Math.abs(Math.round(balance)),
    currency: displayCurrency,
    oweFrom: balance < 0 ? userId : partnerId,
    oweTo: balance < 0 ? partnerId : userId,
  };
}
