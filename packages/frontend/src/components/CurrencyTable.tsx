import React, { useState } from 'react';
import CountryFlag from 'react-country-flag';
import { Loader2 } from 'lucide-react';
import { getVariationColor } from '../utils/format';

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
  source?: string;
}

interface CurrencyTableProps {
  data: CurrencyTableRow[];
  pairKey?: string;
  stacked?: boolean;
  loadingVariations?: boolean;
}

const PRIORITY_CURRENCIES = ['USD', 'EUR', 'BRL', 'GBP', 'JPY', 'REF', 'XAU', 'XAG'];

const CurrencyTable: React.FC<CurrencyTableProps> = ({ data, pairKey, stacked, loadingVariations }) => {
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Función para ordenar los datos
  const orderedData = React.useMemo(() => {
    let sortedData = data.filter((row: CurrencyTableRow) => row.code !== 'ARS');

    if (sortBy) {
      sortedData = [...sortedData].sort((a: CurrencyTableRow, b: CurrencyTableRow) => {
        let aValue: any = a[sortBy as keyof CurrencyTableRow];
        let bValue: any = b[sortBy as keyof CurrencyTableRow];

        // Ordenar fechas dd-MM-yyyy
        if (sortBy === 'date' && aValue && bValue) {
          // dd-MM-yyyy a Date
          const [da, ma, ya] = aValue.split('-').map(Number);
          const [db, mb, yb] = bValue.split('-').map(Number);
          const dateA = new Date(ya, ma - 1, da);
          const dateB = new Date(yb, mb - 1, db);
          return sortDir === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }

        // Ordenar numéricos
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDir === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Ordenar strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDir === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        // Nulos al final
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDir === 'asc' ? 1 : -1;
        if (bValue == null) return sortDir === 'asc' ? -1 : 1;

        return 0;
      });
    } else {
      // Orden por prioridad de monedas si no hay sortBy
      sortedData = [...sortedData].sort((a: CurrencyTableRow, b: CurrencyTableRow) => {
        const aPriority = PRIORITY_CURRENCIES.indexOf(a.code);
        const bPriority = PRIORITY_CURRENCIES.indexOf(b.code);
        if (aPriority === -1 && bPriority === -1) {
          return a.code.localeCompare(b.code);
        }
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      });
    }
    return sortedData;
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
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none">
                Fuente
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedData.map((row, idx) => (
              <tr key={row.code} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
                <td className="px-3 py-2 whitespace-nowrap min-h-[2.5em]">
                  <div className={`flex items-center ${row.customIcon ? 'gap-1' : 'gap-2'} h-[2em]`}>
                    {row.customIcon ? (
                      <span style={{ fontSize: '1.15em', width: '1.5em', height: '1.5em', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginLeft: '-0.18em' }}>{row.customIcon}</span>
                    ) : (
                      <CountryFlag countryCode={row.code === 'REF' ? 'US' : row.flagCode} svg style={{ width: '1.5em', height: '1.5em', borderRadius: '50%' }} />
                    )}
                    <span className="font-semibold text-gray-900 dark:text-white" style={row.customIcon ? { marginLeft: '0.18em' } : {}}>{row.label.split(' ')[0]}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-200 ml-1 hidden sm:inline">{row.label.split(' ').slice(1).join(' ')}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">
                  {loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : row.value !== undefined && row.value !== null ? Number(row.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '-'}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.dayValue)}`}>
                  {loadingVariations ? (
                    <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                  ) : row.dayValue !== undefined && row.dayValue !== null ? (
                    <>
                      {row.dayValue > 0 ? (
                        <span className={getVariationColor(row.dayValue)} style={{marginRight: '0.25em'}}>▲</span>
                      ) : row.dayValue < 0 ? (
                        <span className={getVariationColor(row.dayValue)} style={{marginRight: '0.25em'}}>▼</span>
                      ) : null}
                      <span>{Math.abs(row.dayValue).toLocaleString('es-AR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span>
                    </>
                  ) : '-'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">-</td>
                <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.date ? `${row.date.split('-')[2]}-${row.date.split('-')[1]}-${row.date.split('-')[0]} 16:00 hs` : '-'}</td>
                <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.source || 'BCRA'}</td>
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
            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-white cursor-pointer select-none">
              Fuente
            </th>
          </tr>
        </thead>
        <tbody>
          {orderedData.map((row, idx) => (
            <tr key={row.code} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
              <td className="px-3 py-2 whitespace-nowrap min-h-[2.5em]">
                <div className={`flex items-center ${row.customIcon ? 'gap-1' : 'gap-2'} h-[2em]`}>
                  {row.customIcon ? (
                    <span style={{ fontSize: '1.15em', width: '1.5em', height: '1.5em', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginLeft: '-0.18em' }}>{row.customIcon}</span>
                  ) : (
                    <CountryFlag countryCode={row.code === 'REF' ? 'US' : row.flagCode} svg style={{ width: '1.5em', height: '1.5em', borderRadius: '50%' }} />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-white" style={row.customIcon ? { marginLeft: '0.18em' } : {}}>{row.label.split(' ')[0]}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-200 ml-1 hidden sm:inline">{row.label.split(' ').slice(1).join(' ')}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-white">
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.value !== undefined && row.value !== null ? Number(row.value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.dayValue)}`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.dayValue !== undefined && row.dayValue !== null ? (
                  <>
                    {row.dayValue > 0 ? (
                      <span className={getVariationColor(row.dayValue)} style={{marginRight: '0.25em'}}>▲</span>
                    ) : row.dayValue < 0 ? (
                      <span className={getVariationColor(row.dayValue)} style={{marginRight: '0.25em'}}>▼</span>
                    ) : null}
                    <span>{Math.abs(row.dayValue).toLocaleString('es-AR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span>
                  </>
                ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.dayPercent)}`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.dayPercent !== undefined && row.dayPercent !== null && !isNaN(row.dayPercent) ?
                  (row.dayPercent > 0 ? '+' : '') + row.dayPercent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.weekPercent)}`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.weekPercent !== undefined && row.weekPercent !== null && !isNaN(row.weekPercent)
                  ? (row.weekPercent > 0 ? '+' : '') + row.weekPercent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
                  : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.monthPercent)}`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.monthPercent !== undefined && row.monthPercent !== null && !isNaN(row.monthPercent)
                  ? (row.monthPercent > 0 ? '+' : '') + row.monthPercent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
                  : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.ytdPercent)}`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.ytdPercent !== undefined && row.ytdPercent !== null && !isNaN(row.ytdPercent)
                  ? (row.ytdPercent > 0 ? '+' : '') + row.ytdPercent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
                  : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getVariationColor(row.yoyPercent)}`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.yoyPercent !== undefined && row.yoyPercent !== null && !isNaN(row.yoyPercent)
                  ? (row.yoyPercent > 0 ? '+' : '') + row.yoyPercent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
                  : '-'}
              </td>
              <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.date ? `${row.date.split('-')[2]}-${row.date.split('-')[1]}-${row.date.split('-')[0]} 16:00 hs` : '-'}</td>
              <td className="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-200 whitespace-nowrap">{row.source || 'BCRA'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CurrencyTable; 