import { useState, useEffect } from 'react';
import type { Currency } from '../types';
import { getExchangeRate } from '../services/exchangeRate';
import { toDateString } from '../utils/format';

export function useExchangeRate(base: Currency, target: Currency, date?: string) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (base === target) {
      setRate(1);
      return;
    }

    setLoading(true);
    getExchangeRate(base, target, date ?? toDateString(new Date()))
      .then(setRate)
      .catch(() => setRate(null))
      .finally(() => setLoading(false));
  }, [base, target, date]);

  return { rate, loading };
}
