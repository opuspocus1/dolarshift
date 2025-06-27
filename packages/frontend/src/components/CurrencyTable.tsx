import React, { useState } from 'react';
import CountryFlag from 'react-country-flag';
import { Loader2 } from 'lucide-react';

interface CurrencyTableRow {
  code: string;
  name: string;
  flagCode?: string;
  price?: number;
  value?: number;
  label?: string;
  dayValue?: number;
  dayPercent?: number;
  weekPercent?: number;
  monthPercent?: number;
  ytdPercent?: number;
  yoyPercent?: number;
  date: string;
  customIcon?: string;
  pairKey?: string;
  side?: string;
}

interface CurrencyTableProps {
  data: CurrencyTableRow[];
  pairKey?: string;
  stacked?: boolean;
  loadingVariations?: boolean;
}

const getColor = (value?: number) => {
  if (value === undefined) return '';
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return '';
};

const CurrencyTable: React.FC<CurrencyTableProps> = ({ data, pairKey, stacked, loadingVariations }) => {
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Función para ordenar los datos
  const sortedData = React.useMemo(() => {
    if (!sortBy) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [data, sortBy, sortDir]);

  // Handler para click en encabezado
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  if (stacked) {
    return (
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('label')}>
                Divisa {sortBy === 'label' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('value')}>
                Valor {sortBy === 'value' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('dayValue')}>
                Día {sortBy === 'dayValue' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('dayPercent')}>
                % {sortBy === 'dayPercent' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('weekPercent')}>
                Semanal {sortBy === 'weekPercent' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('monthPercent')}>
                Mensual {sortBy === 'monthPercent' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('ytdPercent')}>
                YTD {sortBy === 'ytdPercent' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('yoyPercent')}>
                Interanual {sortBy === 'yoyPercent' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('date')}>
                Fecha {sortBy === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={row.code} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
                <td className="px-3 py-2 flex items-center gap-2 whitespace-nowrap">
                  {row.customIcon ? (
                    <span style={{ fontSize: '1.5em', marginRight: '0.25em' }}>{row.customIcon}</span>
                  ) : (
                    <CountryFlag countryCode={row.code === 'REF' ? 'US' : row.flagCode} svg style={{ width: '1.5em', height: '1.5em', borderRadius: '50%' }} />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white">{row.label.split(' ')[0]}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-200 ml-1">{row.label.split(' ').slice(1).join(' ')}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">
                  {loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : row.value !== undefined && row.value !== null ? Number(row.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '-'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
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
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('label')}>
              Divisa {sortBy === 'label' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('value')}>
              Valor {sortBy === 'value' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('dayValue')}>
              Día {sortBy === 'dayValue' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('dayPercent')}>
              % {sortBy === 'dayPercent' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('weekPercent')}>
              Semanal {sortBy === 'weekPercent' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('monthPercent')}>
              Mensual {sortBy === 'monthPercent' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('ytdPercent')}>
              YTD {sortBy === 'ytdPercent' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('yoyPercent')}>
              Interanual {sortBy === 'yoyPercent' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none" onClick={() => handleSort('date')}>
              Fecha {sortBy === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.code} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
              <td className="px-3 py-2 flex items-center gap-2 whitespace-nowrap">
                {row.customIcon ? (
                  <span style={{ fontSize: '1.5em', marginRight: '0.25em' }}>{row.customIcon}</span>
                ) : (
                  <CountryFlag countryCode={row.code === 'REF' ? 'US' : row.flagCode} svg style={{ width: '1.5em', height: '1.5em', borderRadius: '50%' }} />
                )}
                <span className="font-semibold text-gray-900 dark:text-white">{row.label.split(' ')[0]}</span>
                <span className="text-xs text-gray-500 dark:text-gray-200 ml-1">{row.label.split(' ').slice(1).join(' ')}</span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.value !== undefined && row.value !== null ? Number(row.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.dayValue)} text-gray-900 dark:text-white`}>
                {row.dayValue !== undefined && row.dayValue !== null ? (
                  <>
                    {row.dayValue > 0 ? <span style={{marginRight: '0.25em'}}>▲</span> : row.dayValue < 0 ? <span style={{marginRight: '0.25em'}}>▼</span> : null}
                    <span>{Math.abs(row.dayValue).toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span>
                  </>
                ) : loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.dayPercent)} text-gray-900 dark:text-white`}>
                {row.dayPercent !== undefined && row.dayPercent !== null && !isNaN(row.dayPercent) ?
                  (row.dayPercent > 0 ? '+' : '') + row.dayPercent.toFixed(2) + '%' : loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.weekPercent)} text-gray-900 dark:text-white`}>
                {row.weekPercent !== undefined && row.weekPercent !== null && !isNaN(row.weekPercent)
                  ? (row.weekPercent > 0 ? '+' : '') + row.weekPercent.toFixed(2) + '%'
                  : loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.monthPercent)} text-gray-900 dark:text-white`}>
                {row.monthPercent !== undefined && row.monthPercent !== null && !isNaN(row.monthPercent)
                  ? (row.monthPercent > 0 ? '+' : '') + row.monthPercent.toFixed(2) + '%'
                  : loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.ytdPercent)} text-gray-900 dark:text-white`}>
                {row.ytdPercent !== undefined && row.ytdPercent !== null && !isNaN(row.ytdPercent)
                  ? (row.ytdPercent > 0 ? '+' : '') + row.ytdPercent.toFixed(2) + '%'
                  : loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.yoyPercent)} text-gray-900 dark:text-white`}>
                {row.yoyPercent !== undefined && row.yoyPercent !== null && !isNaN(row.yoyPercent)
                  ? (row.yoyPercent > 0 ? '+' : '') + row.yoyPercent.toFixed(2) + '%'
                  : loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : '-'}
              </td>
              <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrencyTable; 