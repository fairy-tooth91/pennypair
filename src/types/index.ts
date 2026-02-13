// ============================================
// 기본 타입
// ============================================

export type Currency = 'KRW' | 'JPY' | 'USD';
export type Language = 'ko' | 'ja' | 'en';
export type TransactionType = 'income' | 'expense';
export type SplitType = '50_50' | 'custom' | 'paid_for_self' | 'paid_for_partner';
export type SettlementType = 'monthly' | 'per_transaction';
export type SettlementStatus = 'pending' | 'confirmed' | 'cancelled';

// ============================================
// DB 엔티티 (camelCase)
// ============================================

export interface Profile {
  id: string;
  displayName: string;
  email: string;
  homeCurrency: Currency;
  preferredLanguage: Language;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface Category {
  id: string;
  i18nKey: string;
  icon: string;
  type: TransactionType;
  sortOrder: number;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  coupleId: string;
  paidBy: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  currency: Currency;
  convertedAmount: number | null;
  convertedCurrency: Currency | null;
  exchangeRate: number | null;
  splitType: SplitType;
  splitRatio: number;
  splitAmount: number | null;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  coupleId: string;
  type: SettlementType;
  status: SettlementStatus;
  requestedBy: string;
  requestedTo: string;
  totalAmount: number;
  currency: Currency;
  periodStart: string;
  periodEnd: string;
  memo: string;
  settledAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
}

export interface SettlementItem {
  id: string;
  settlementId: string;
  transactionId: string;
  amount: number;
  currency: Currency;
  createdAt: string;
}

export interface ExchangeRateCache {
  id: string;
  baseCurrency: Currency;
  targetCurrency: Currency;
  rate: number;
  rateDate: string;
  fetchedAt: string;
}

// ============================================
// DB row 타입 (snake_case) - Supabase 응답용
// ============================================

export interface ProfileRow {
  id: string;
  display_name: string;
  email: string;
  home_currency: Currency;
  preferred_language: Language;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoupleRow {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  i18n_key: string;
  icon: string;
  type: TransactionType;
  sort_order: number;
  is_default: boolean;
}

export interface TransactionRow {
  id: string;
  couple_id: string;
  paid_by: string;
  date: string;
  type: TransactionType;
  category_id: string;
  amount: number;
  currency: Currency;
  converted_amount: number | null;
  converted_currency: Currency | null;
  exchange_rate: number | null;
  split_type: SplitType;
  split_ratio: number;
  split_amount: number | null;
  memo: string;
  created_at: string;
  updated_at: string;
}

export interface SettlementRow {
  id: string;
  couple_id: string;
  type: SettlementType;
  status: SettlementStatus;
  requested_by: string;
  requested_to: string;
  total_amount: number;
  currency: Currency;
  period_start: string;
  period_end: string;
  memo: string;
  settled_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
}

export interface SettlementItemRow {
  id: string;
  settlement_id: string;
  transaction_id: string;
  amount: number;
  currency: Currency;
  created_at: string;
}

export interface ExchangeRateCacheRow {
  id: string;
  base_currency: Currency;
  target_currency: Currency;
  rate: number;
  rate_date: string;
  fetched_at: string;
}

// ============================================
// 폼/입력용 타입
// ============================================

export interface TransactionInput {
  date: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  currency: Currency;
  splitType: SplitType;
  splitRatio: number;
  splitAmount: number | null;
  memo: string;
  paidBy: string;
}

export interface SettlementInput {
  type: SettlementType;
  totalAmount: number;
  currency: Currency;
  periodStart: string;
  periodEnd: string;
  memo: string;
  items: SettlementItemInput[];
}

export interface SettlementItemInput {
  transactionId: string;
  amount: number;
  currency: Currency;
}

// ============================================
// 상수
// ============================================

export const CURRENCIES: Currency[] = ['KRW', 'JPY', 'USD'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  KRW: '₩',
  JPY: '¥',
  USD: '$',
};

export const LOCALE_MAP: Record<Language, string> = {
  ko: 'ko-KR',
  ja: 'ja-JP',
  en: 'en-US',
};
