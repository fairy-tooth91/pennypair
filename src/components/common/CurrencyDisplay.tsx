import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';
import type { Currency, Language } from '../../types';

interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  convertedAmount?: number | null;
  convertedCurrency?: Currency | null;
  className?: string;
}

export default function CurrencyDisplay({
  amount,
  currency,
  convertedAmount,
  convertedCurrency,
  className = '',
}: CurrencyDisplayProps) {
  const { profile } = useAuth();
  const lang = (profile?.preferredLanguage ?? 'en') as Language;

  return (
    <span className={className}>
      <span className="font-medium">{formatCurrency(amount, currency, lang)}</span>
      {convertedAmount != null && convertedCurrency && (
        <span className="ml-1 text-sm text-gray-400">
          / {formatCurrency(convertedAmount, convertedCurrency, lang)}
        </span>
      )}
    </span>
  );
}
