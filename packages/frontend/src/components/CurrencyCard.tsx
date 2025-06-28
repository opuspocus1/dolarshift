import React from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { ExchangeRate } from '../services/exchangeService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import CountryFlag from 'react-country-flag';

// Mapeo simple de banderas y símbolos por código de moneda
const currencyMeta: Record<string, { flag: string; symbol: string }> = {
  USD: { flag: '🇺🇸', symbol: '$' },
  EUR: { flag: '🇪🇺', symbol: '€' },
  ARS: { flag: '🇦🇷', symbol: '$' },
  BRL: { flag: '🇧🇷', symbol: 'R$' },
  GBP: { flag: '🇬🇧', symbol: '£' },
  JPY: { flag: '🇯🇵', symbol: '¥' },
  CNY: { flag: '🇨🇳', symbol: '¥' },
  CHF: { flag: '🇨🇭', symbol: 'Fr' },
  AUD: { flag: '🇦🇺', symbol: '$' },
  CAD: { flag: '🇨🇦', symbol: '$' },
  NZD: { flag: '🇳🇿', symbol: '$' },
  MXP: { flag: '🇲🇽', symbol: '$' },
  CLP: { flag: '🇨🇱', symbol: '$' },
  PEN: { flag: '🇵🇪', symbol: 'S/' },
  UYU: { flag: '🇺🇾', symbol: '$' },
  COP: { flag: '🇨🇴', symbol: '$' },
  PYG: { flag: '🇵🇾', symbol: '₲' },
  BOB: { flag: '🇧🇴', symbol: 'Bs' },
  RUB: { flag: '🇷🇺', symbol: '₽' },
  SEK: { flag: '🇸🇪', symbol: 'kr' },
  NOK: { flag: '🇳🇴', symbol: 'kr' },
  DKK: { flag: '🇩🇰', symbol: 'kr' },
  CZK: { flag: '🇨🇿', symbol: 'Kč' },
  HUF: { flag: '🇭🇺', symbol: 'Ft' },
  TRY: { flag: '🇹🇷', symbol: '₺' },
  ILS: { flag: '🇮🇱', symbol: '₪' },
  INR: { flag: '🇮🇳', symbol: '₹' },
  ZAR: { flag: '🇿🇦', symbol: 'R' },
  SGD: { flag: '🇸🇬', symbol: '$' },
  HKD: { flag: '🇭🇰', symbol: '$' },
  CNH: { flag: '🇨🇳', symbol: '¥' },
  XAU: { flag: '🥇', symbol: 'Au' }, // Oro
  XAG: { flag: '🥈', symbol: 'Ag' }, // Plata
  XDR: { flag: '💱', symbol: 'XDR' }, // DEG
  // Fallback
  DEFAULT: { flag: '🏳️', symbol: '' }
};

// Mapeo de código de moneda a código de país para banderas
const currencyToCountry: Record<string, string> = {
  USD: 'US',
  EUR: 'EU',
  ARS: 'AR',
  BRL: 'BR',
  GBP: 'GB',
  JPY: 'JP',
  CNY: 'CN',
  CHF: 'CH',
  AUD: 'AU',
  CAD: 'CA',
  NZD: 'NZ',
  MXP: 'MX',
  CLP: 'CL',
  PEN: 'PE',
  UYU: 'UY',
  COP: 'CO',
  PYG: 'PY',
  BOB: 'BO',
  RUB: 'RU',
  SEK: 'SE',
  NOK: 'NO',
  DKK: 'DK',
  CZK: 'CZ',
  HUF: 'HU',
  TRY: 'TR',
  ILS: 'IL',
  INR: 'IN',
  ZAR: 'ZA',
  SGD: 'SG',
  HKD: 'HK',
  CNH: 'CN',
  AWG: 'AW',
  VEB: 'VE', // Venezuela
  VND: 'VN', // Vietnam
  RSD: 'RS', // Serbia
  NIO: 'NI', // Nicaragua
  // ...otros casos especiales
};

interface CurrencyCardProps {
  currency: ExchangeRate;
  baseCurrency?: string;
  dayPercent?: number;
  loadingVariations?: boolean;
}

const getColor = (value?: number) => {
  if (value === undefined) return '';
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return '';
};

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, baseCurrency = 'USD', dayPercent, loadingVariations }) => {
  // Usar solo el código de moneda, sin bandera
  let meta = currencyMeta[currency.codigomoneda || currency.code] || currencyMeta.DEFAULT;
  let displayName = currency.descripcion || currency.name;
  let displaySymbol = currency.codigomoneda || currency.code;
  let flagCode = currencyToCountry[currency.codigomoneda || currency.code];
  let customIcon = null;
  if ((currency.codigomoneda || currency.code) === 'REF') {
    displayName = 'DOLAR USA COM 3500';
    displaySymbol = 'USD3500';
    flagCode = 'US';
  }
  if ((currency.codigomoneda || currency.code) === 'USD') {
    displayName = 'DOLAR USA';
  }
  if ((currency.codigomoneda || currency.code) === 'XDR') {
    displayName = 'DEG FMI';
    flagCode = undefined;
    customIcon = <span style={{ fontSize: '1.5em', marginRight: '0.5em' }} title="DEG">💱</span>;
  }
  if ((currency.codigomoneda || currency.code) === 'XAU') {
    flagCode = undefined;
    customIcon = <span style={{ fontSize: '1.5em', marginRight: '0.5em' }} title="Oro">🥇</span>;
  }
  if ((currency.codigomoneda || currency.code) === 'XAG') {
    flagCode = undefined;
    customIcon = <span style={{ fontSize: '1.5em', marginRight: '0.5em' }} title="Plata">🥈</span>;
  }

  // Formatear la fecha de la API y la hora actual de Buenos Aires
  let formattedDateTime = 'N/A';
  if (currency.date) {
    const apiDate = parseISO(currency.date);
    // Obtener la hora actual de Buenos Aires
    const nowBuenosAires = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
    );
    // Combinar fecha de la API y hora actual de Buenos Aires
    const combinedDate = new Date(apiDate);
    combinedDate.setHours(nowBuenosAires.getHours(), nowBuenosAires.getMinutes(), 0, 0);
    formattedDateTime = format(combinedDate, "d 'de' MMMM 'de' yyyy HH:mm", { locale: es }) + ' hs';
  }

  // Formatear la tasa de cambio
  const formatRate = (rate: number | null | undefined, fullDecimals = false) => {
    if (rate === null || rate === undefined) return '-';
    return Number(rate).toLocaleString('es-AR', {
      minimumFractionDigits: fullDecimals ? 6 : 2,
      maximumFractionDigits: fullDecimals ? 12 : 2
    });
  };

  // Determinar el formato de cotización
  const getRateFormat = () => {
    if (currency.code === 'USD') return 'USD/ARS';
    return currency.isUsdQuoted ? `${currency.code}/USD` : `USD/${currency.code}`;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full relative">
      {/* Porcentaje arriba, centrado y al raz del borde */}
      <span className={`absolute left-1/2 -translate-x-1/2 -top-3 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-200 dark:border-gray-700 shadow ${getColor(dayPercent)}`}>
        {loadingVariations ? (
          <Loader2 className="animate-spin w-4 h-4 text-blue-500" />
        ) : dayPercent !== undefined && dayPercent !== null && !isNaN(dayPercent) ? (
          (dayPercent > 0 ? '+' : '') + dayPercent.toFixed(2) + '%'
        ) : '-%'}
      </span>
      <div className="flex flex-col items-start mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            {/* Bandera o icono */}
            {customIcon ? customIcon : flagCode && (
              <CountryFlag
                countryCode={flagCode}
                svg
                style={{ width: '1.5em', height: '1.5em', borderRadius: '50%', marginRight: '0.5em' }}
                title={currency.codigomoneda || currency.code}
              />
            )}
            <span>{displaySymbol}</span>
          </h3>
        </div>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 w-full block">{displayName}</p>
      </div>
      {/* Datos principales igual que en la tabla, en formato compacto */}
      <div className="w-full mt-2">
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="font-semibold text-gray-900 dark:text-white">{currency.pairKey || `${displaySymbol}/${baseCurrency}`}</td>
              <td className="font-mono text-right text-lg text-gray-900 dark:text-white">{formatRate(currency.value, false)}</td>
            </tr>
            <tr>
              <td className="text-gray-500 dark:text-gray-400">Día</td>
              <td className="text-right font-mono text-gray-900 dark:text-white">{currency.dayValue !== undefined && currency.dayValue !== null ? Number(currency.dayValue).toLocaleString('es-AR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : '-'}</td>
            </tr>
            <tr>
              <td className="text-gray-500 dark:text-gray-400">Semanal</td>
              <td className="text-right font-mono text-gray-900 dark:text-white">{currency.weekPercent !== undefined && currency.weekPercent !== null && !isNaN(currency.weekPercent) ? (currency.weekPercent > 0 ? '+' : '') + currency.weekPercent.toFixed(2) + '%' : '-'}</td>
            </tr>
            <tr>
              <td className="text-gray-500 dark:text-gray-400">Mensual</td>
              <td className="text-right font-mono text-gray-900 dark:text-white">{currency.monthPercent !== undefined && currency.monthPercent !== null && !isNaN(currency.monthPercent) ? (currency.monthPercent > 0 ? '+' : '') + currency.monthPercent.toFixed(2) + '%' : '-'}</td>
            </tr>
            <tr>
              <td className="text-gray-500 dark:text-gray-400">YTD</td>
              <td className="text-right font-mono text-gray-900 dark:text-white">{currency.ytdPercent !== undefined && currency.ytdPercent !== null && !isNaN(currency.ytdPercent) ? (currency.ytdPercent > 0 ? '+' : '') + currency.ytdPercent.toFixed(2) + '%' : '-'}</td>
            </tr>
            <tr>
              <td className="text-gray-500 dark:text-gray-400">Interanual</td>
              <td className="text-right font-mono text-gray-900 dark:text-white">{currency.yoyPercent !== undefined && currency.yoyPercent !== null && !isNaN(currency.yoyPercent) ? (currency.yoyPercent > 0 ? '+' : '') + currency.yoyPercent.toFixed(2) + '%' : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrencyCard;