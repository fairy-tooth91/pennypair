import { type Currency, type Language, LOCALE_MAP } from '../types';

export function formatCurrency(
  amount: number,
  currency: Currency,
  language: Language = 'en',
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : currency === 'KRW' ? 0 : 2,
  }).format(amount);
}

export function formatDate(
  date: string,
  language: Language = 'en',
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatMonth(
  date: string,
  language: Language = 'en',
): string {
  const locale = LOCALE_MAP[language];
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(date));
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
