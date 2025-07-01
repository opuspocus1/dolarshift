// Utilidad para colorear variaciones
export function getVariationColor(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '';
  let num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (isNaN(num)) return '';
  if (num > 0) return 'text-green-600 dark:text-green-400';
  if (num < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-400';
} 