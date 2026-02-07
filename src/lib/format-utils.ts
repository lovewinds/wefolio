export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
};

export function formatForeignAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  if (!symbol) return amount.toLocaleString('ko-KR');
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatExchangeRate(rate: number): string {
  return `₩${Math.round(rate).toLocaleString('ko-KR')}`;
}
