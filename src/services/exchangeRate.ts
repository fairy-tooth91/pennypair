import type { Currency } from '../types';
import { fetchCachedRate, saveCachedRate } from './supabase';
import { toDateString } from '../utils/format';

const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';

export async function getExchangeRate(
  base: Currency,
  target: Currency,
  date?: string,
): Promise<number> {
  if (base === target) return 1;

  const rateDate = date ?? toDateString(new Date());

  // 1. 캐시 확인
  const cached = await fetchCachedRate(base, target, rateDate);
  if (cached) return cached;

  // 2. API 호출
  try {
    const res = await fetch(
      `${FRANKFURTER_BASE}/${rateDate}?base=${base}&symbols=${target}`,
    );
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);

    const data = await res.json();
    const rate = data.rates[target] as number;

    // 3. 캐시 저장
    await saveCachedRate(base, target, rate, rateDate);

    return rate;
  } catch {
    // API 실패 시 최근 캐시 반환
    const fallback = await fetchCachedRate(base, target, rateDate);
    if (fallback) return fallback;
    throw new Error(`Failed to fetch exchange rate: ${base} → ${target}`);
  }
}

export function convertAmount(
  amount: number,
  rate: number,
): number {
  return Math.round(amount * rate * 100) / 100;
}
