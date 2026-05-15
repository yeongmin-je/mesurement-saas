export function formatKoreanDate(input: Date | string | null): string {
  if (!input) return '-';
  const date = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatKRW(amount: number | null): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}
