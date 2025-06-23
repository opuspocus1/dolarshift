import React from 'react';
import CountryFlag from 'react-country-flag';

interface CurrencyTableRow {
  code: string;
  name: string;
  flagCode?: string;
  price: number;
  dayValue: number;
  dayPercent: number;
  weekPercent?: number;
  monthPercent?: number;
  ytdPercent?: number;
  yoyPercent?: number;
  date: string;
  customIcon?: string;
  pairKey?: string;
}

interface CurrencyTableProps {
  data: CurrencyTableRow[];
  pairKey?: string;
  stacked?: boolean;
}

const getColor = (value?: number) => {
  if (value === undefined) return '';
  if (value > 0) return 'text-green-600 bg-green-50';
  if (value < 0) return 'text-red-600 bg-red-50';
  return '';
};

const CurrencyTable: React.FC<CurrencyTableProps> = ({ data, pairKey, stacked }) => {
  if (stacked) {
    return (
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white">Divisa</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Valor</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.code + '-' + row.side} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
                <td className="px-3 py-2 flex items-center gap-2 whitespace-nowrap">
                  {row.customIcon ? (
                    <span style={{ fontSize: '1.5em', marginRight: '0.25em' }}>{row.customIcon}</span>
                  ) : row.flagCode && (
                    <CountryFlag countryCode={row.flagCode} svg style={{ width: '1.5em', height: '1.5em', borderRadius: '50%' }} />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">{row.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-200">{row.name}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">{row.value !== undefined && row.value !== null ? Number(row.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 12 }) : '-'}</td>
                <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
          <tr>
            {pairKey && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white">Par</th>}
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white">Divisa</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Precio</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Día</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">%</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Semanal</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Mensual</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">YTD</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">YoY</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.code} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
              {pairKey && <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">{row[pairKey]}</td>}
              <td className="px-3 py-2 flex items-center gap-2 whitespace-nowrap">
                {row.customIcon ? (
                  <span style={{ fontSize: '1.5em', marginRight: '0.25em' }}>{row.customIcon}</span>
                ) : row.flagCode && (
                  <CountryFlag countryCode={row.flagCode} svg style={{ width: '1.5em', height: '1.5em', borderRadius: '50%' }} />
                )}
                <span className="font-semibold text-gray-900 dark:text-white">{row.code}</span>
                <span className="text-xs text-gray-500 dark:text-gray-200">{row.name}</span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">{row.price.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.dayValue)} text-gray-900 dark:text-white`}>{row.dayValue > 0 ? '▲' : row.dayValue < 0 ? '▼' : ''} {Math.abs(row.dayValue).toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.dayPercent)} text-gray-900 dark:text-white`}>{row.dayPercent > 0 ? '+' : ''}{row.dayPercent.toFixed(2)}%</td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.weekPercent)} text-gray-900 dark:text-white`}>{row.weekPercent !== undefined ? (row.weekPercent > 0 ? '+' : '') + row.weekPercent.toFixed(2) + '%' : '-'}</td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.monthPercent)} text-gray-900 dark:text-white`}>{row.monthPercent !== undefined ? (row.monthPercent > 0 ? '+' : '') + row.monthPercent.toFixed(2) + '%' : '-'}</td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.ytdPercent)} text-gray-900 dark:text-white`}>{row.ytdPercent !== undefined ? (row.ytdPercent > 0 ? '+' : '') + row.ytdPercent.toFixed(2) + '%' : '-'}</td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.yoyPercent)} text-gray-900 dark:text-white`}>{row.yoyPercent !== undefined ? (row.yoyPercent > 0 ? '+' : '') + row.yoyPercent.toFixed(2) + '%' : '-'}</td>
              <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrencyTable; 