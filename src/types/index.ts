// ============================================
// 기본 타입
// ============================================

export type Currency = 'KRW' | 'JPY' | 'USD';
export type Language = 'ko' | 'ja' | 'en';
export type TransactionType = 'income' | 'expense';
export type SplitType = '50_50' | 'custom' | 'paid_for_self' | 'paid_for_partner';

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
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  coupleId: string;
  settledBy: string;
  settledTo: string;
  amount: number;
  currency: Currency;
  periodStart: string;
  periodEnd: string;
  memo: string;
  settledAt: string;
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
  memo: string;
  created_at: string;
  updated_at: string;
}

export interface SettlementRow {
  id: string;
  couple_id: string;
  settled_by: string;
  settled_to: string;
  amount: number;
  currency: Currency;
  period_start: string;
  period_end: string;
  memo: string;
  settled_at: string;
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
  memo: string;
  paidBy: string;
}

export interface SettlementInput {
  amount: number;
  currency: Currency;
  periodStart: string;
  periodEnd: string;
  memo: string;
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
