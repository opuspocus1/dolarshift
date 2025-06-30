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

const PRIORITY_CURRENCIES = ['USD', 'EUR', 'BRL', 'GBP', 'JPY'];

const TOP5_CODES = [
  { code: 'USD/USD', label: 'USD/USD DÓLAR E.E.U.U.', value: 1, flagCode: 'US', name: 'DÓLAR E.E.U.U.' },
  { code: 'JPY/USD', label: 'JPY/USD YEN', value: undefined, flagCode: 'JP', name: 'YEN' },
  { code: 'EUR/USD', label: 'EUR/USD EURO', value: undefined, flagCode: 'EU', name: 'EURO' },
  { code: 'BRL/USD', label: 'BRL/USD REAL', value: undefined, flagCode: 'BR', name: 'REAL' },
  { code: 'GBP/USD', label: 'GBP/USD LIBRA', value: undefined, flagCode: 'GB', name: 'LIBRA' },
];

const getTop5AndRest = (data: CurrencyTableRow[]): CurrencyTableRow[] => {
  // Crear un mapa para acceso rápido
  const map = new Map(data.map(row => [row.code, row]));
  // Construir el top 5, usando datos reales si existen, o el objeto por defecto si no
  const top5 = TOP5_CODES.map(({ code, label, value, flagCode, name }) => {
    if (map.has(code)) return map.get(code)!;
    // Si no existe, crear un objeto por defecto (solo con los campos mínimos)
    return {
      code,
      label,
      value: value === undefined ? undefined : value,
      flagCode,
      name,
      date: data[0]?.date || '', // Usar la fecha del primer dato si existe
    };
  });
  // El resto, ordenado alfabéticamente por code
  const rest = data
    .filter(row => !TOP5_CODES.some(t => t.code === row.code) && row.code !== 'ARS')
    .sort((a, b) => a.code.localeCompare(b.code));
  return [...top5, ...rest];
};

const CurrencyTable: React.FC<CurrencyTableProps> = ({ data, pairKey, stacked, loadingVariations }) => {
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Función para ordenar los datos
  const orderedData = React.useMemo(() => {
    return getTop5AndRest(data);
  }, [data]);

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
            {orderedData.map((row, idx) => (
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
          {orderedData.map((row, idx) => (
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
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.dayValue !== undefined && row.dayValue !== null ? (
                  <>
                    {row.dayValue > 0 ? <span style={{marginRight: '0.25em'}}>▲</span> : row.dayValue < 0 ? <span style={{marginRight: '0.25em'}}>▼</span> : null}
                    <span>{Math.abs(row.dayValue).toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span>
                  </>
                ) : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.dayPercent)} text-gray-900 dark:text-white`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.dayPercent !== undefined && row.dayPercent !== null && !isNaN(row.dayPercent) ?
                  (row.dayPercent > 0 ? '+' : '') + row.dayPercent.toFixed(2) + '%' : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.weekPercent)} text-gray-900 dark:text-white`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.weekPercent !== undefined && row.weekPercent !== null && !isNaN(row.weekPercent)
                  ? (row.weekPercent > 0 ? '+' : '') + row.weekPercent.toFixed(2) + '%'
                  : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.monthPercent)} text-gray-900 dark:text-white`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.monthPercent !== undefined && row.monthPercent !== null && !isNaN(row.monthPercent)
                  ? (row.monthPercent > 0 ? '+' : '') + row.monthPercent.toFixed(2) + '%'
                  : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.ytdPercent)} text-gray-900 dark:text-white`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.ytdPercent !== undefined && row.ytdPercent !== null && !isNaN(row.ytdPercent)
                  ? (row.ytdPercent > 0 ? '+' : '') + row.ytdPercent.toFixed(2) + '%'
                  : '-'}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${getColor(row.yoyPercent)} text-gray-900 dark:text-white`}>
                {loadingVariations ? (
                  <Loader2 className="animate-spin w-4 h-4 mx-auto text-blue-500" />
                ) : row.yoyPercent !== undefined && row.yoyPercent !== null && !isNaN(row.yoyPercent)
                  ? (row.yoyPercent > 0 ? '+' : '') + row.yoyPercent.toFixed(2) + '%'
                  : '-'}
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