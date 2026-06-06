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

// 입력칸 표시용: 평문 숫자 문자열에 천 단위 콤마를 붙인다.
// 상태는 평문으로 유지하고 표시할 때만 사용한다(소수점 입력 중·소수부 보존).
export function formatThousandsInput(value: string): string {
  if (value === '') return '';
  const hasDot = value.includes('.');
  const [intRaw, ...decRaw] = value.split('.');
  const intDigits = intRaw.replace(/\D/g, '');
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!hasDot) return grouped;
  const decDigits = decRaw.join('').replace(/\D/g, '');
  return `${grouped}.${decDigits}`;
}

// 입력칸 onChange용: 콤마를 제거해 평문 숫자 문자열로 되돌린다.
export function stripThousandsInput(value: string): string {
  return value.replace(/,/g, '');
}
