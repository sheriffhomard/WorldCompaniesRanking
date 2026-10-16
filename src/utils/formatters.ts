import { Currency } from '../types';

export const USD_TO_EUR_RATE = 0.92;

export function formatCurrencyValue(
  valueInBillionsUsd: number,
  currency: Currency,
  decimals: number = 1
): string {
  const converted = currency === 'EUR' ? valueInBillionsUsd * USD_TO_EUR_RATE : valueInBillionsUsd;
  const formatted = converted.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return `${formatted} ${currency === 'EUR' ? 'Md€' : 'Md$'}`;
}

export function formatCompactCurrency(
  valueInBillionsUsd: number,
  currency: Currency,
  decimals: number = 1
): string {
  const converted = currency === 'EUR' ? valueInBillionsUsd * USD_TO_EUR_RATE : valueInBillionsUsd;
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${converted.toFixed(decimals)}B`;
}

export function formatPercentage(value: number, showSign: boolean = false): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function downloadJsonFile(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(val => `"${val}"`).join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
