import { createClient } from '@supabase/supabase-js';
import type {
  Profile, ProfileRow,
  Couple, CoupleRow,
  Category, CategoryRow,
  Transaction, TransactionRow, TransactionInput,
  Settlement, SettlementRow, SettlementInput,
  ExchangeRateCache, ExchangeRateCacheRow,
  Currency,
} from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// 매핑 함수: snake_case ↔ camelCase
// ============================================

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    homeCurrency: row.home_currency,
    preferredLanguage: row.preferred_language,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCouple(row: CoupleRow): Couple {
  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    createdAt: row.created_at,
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    i18nKey: row.i18n_key,
    icon: row.icon,
    type: row.type,
    sortOrder: row.sort_order,
    isDefault: row.is_default,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    coupleId: row.couple_id,
    paidBy: row.paid_by,
    date: row.date,
    type: row.type,
    categoryId: row.category_id,
    amount: Number(row.amount),
    currency: row.currency,
    convertedAmount: row.converted_amount ? Number(row.converted_amount) : null,
    convertedCurrency: row.converted_currency,
    exchangeRate: row.exchange_rate ? Number(row.exchange_rate) : null,
    splitType: row.split_type,
    splitRatio: Number(row.split_ratio),
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    coupleId: row.couple_id,
    settledBy: row.settled_by,
    settledTo: row.settled_to,
    amount: Number(row.amount),
    currency: row.currency,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    memo: row.memo,
    settledAt: row.settled_at,
  };
}

export function toExchangeRate(row: ExchangeRateCacheRow): ExchangeRateCache {
  return {
    id: row.id,
    baseCurrency: row.base_currency,
    targetCurrency: row.target_currency,
    rate: Number(row.rate),
    rateDate: row.rate_date,
    fetchedAt: row.fetched_at,
  };
}

// ============================================
// Auth
// ============================================

export async function signUp(email: string, password: string, displayName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ============================================
// Profiles
// ============================================

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return toProfile(data as ProfileRow);
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'displayName' | 'homeCurrency' | 'preferredLanguage' | 'avatarUrl'>>) {
  const row: Record<string, unknown> = {};
  if (updates.displayName !== undefined) row.display_name = updates.displayName;
  if (updates.homeCurrency !== undefined) row.home_currency = updates.homeCurrency;
  if (updates.preferredLanguage !== undefined) row.preferred_language = updates.preferredLanguage;
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;

  const { data, error } = await supabase
    .from('profiles')
    .update(row)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return toProfile(data as ProfileRow);
}

// ============================================
// Couples
// ============================================

export async function fetchCouple(userId: string): Promise<Couple | null> {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();
  if (error || !data) return null;
  return toCouple(data as CoupleRow);
}

// ============================================
// Categories
// ============================================

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type')
    .order('sort_order');
  if (error) throw error;
  return (data as CategoryRow[]).map(toCategory);
}

// ============================================
// Transactions
// ============================================

export async function fetchTransactions(coupleId: string, month?: string): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('couple_id', coupleId)
    .order('date', { ascending: false });

  if (month) {
    const start = `${month}-01`;
    const endDate = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0);
    const end = `${month}-${String(endDate.getDate()).padStart(2, '0')}`;
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as TransactionRow[]).map(toTransaction);
}

export async function createTransaction(
  coupleId: string,
  userId: string,
  input: TransactionInput,
  convertedAmount: number | null,
  convertedCurrency: Currency | null,
  exchangeRate: number | null,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      couple_id: coupleId,
      paid_by: userId,
      date: input.date,
      type: input.type,
      category_id: input.categoryId,
      amount: input.amount,
      currency: input.currency,
      converted_amount: convertedAmount,
      converted_currency: convertedCurrency,
      exchange_rate: exchangeRate,
      split_type: input.splitType,
      split_ratio: input.splitRatio,
      memo: input.memo,
    })
    .select()
    .single();
  if (error) throw error;
  return toTransaction(data as TransactionRow);
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>) {
  const row: Record<string, unknown> = {};
  if (input.date !== undefined) row.date = input.date;
  if (input.type !== undefined) row.type = input.type;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.amount !== undefined) row.amount = input.amount;
  if (input.currency !== undefined) row.currency = input.currency;
  if (input.splitType !== undefined) row.split_type = input.splitType;
  if (input.splitRatio !== undefined) row.split_ratio = input.splitRatio;
  if (input.memo !== undefined) row.memo = input.memo;

  const { data, error } = await supabase
    .from('transactions')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toTransaction(data as TransactionRow);
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Settlements
// ============================================

export async function fetchSettlements(coupleId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('couple_id', coupleId)
    .order('settled_at', { ascending: false });
  if (error) throw error;
  return (data as SettlementRow[]).map(toSettlement);
}

export async function createSettlement(
  coupleId: string,
  settledBy: string,
  settledTo: string,
  input: SettlementInput,
): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      couple_id: coupleId,
      settled_by: settledBy,
      settled_to: settledTo,
      amount: input.amount,
      currency: input.currency,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      memo: input.memo,
    })
    .select()
    .single();
  if (error) throw error;
  return toSettlement(data as SettlementRow);
}

// ============================================
// Exchange Rate Cache
// ============================================

export async function fetchCachedRate(
  base: Currency,
  target: Currency,
  date: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('exchange_rate_cache')
    .select('rate')
    .eq('base_currency', base)
    .eq('target_currency', target)
    .eq('rate_date', date)
    .single();
  return data ? Number(data.rate) : null;
}

export async function saveCachedRate(
  base: Currency,
  target: Currency,
  rate: number,
  date: string,
) {
  await supabase
    .from('exchange_rate_cache')
    .upsert({
      base_currency: base,
      target_currency: target,
      rate,
      rate_date: date,
    }, { onConflict: 'base_currency,target_currency,rate_date' });
}
