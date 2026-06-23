export function formatPrice(value: number, currency: string): string {
  const n = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(value));
  return `${n} ${currency}`;
}

export function photoUrl(url: string | undefined): string {
  return url || '';
}
