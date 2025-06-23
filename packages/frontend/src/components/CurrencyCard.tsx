import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
  // ...otros casos especiales
};

interface CurrencyCardProps {
  currency: ExchangeRate;
  baseCurrency?: string;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, baseCurrency = 'USD' }) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full">
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
      <div className="space-y-4 mt-2">
        {/* Tasa relativa al USD */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {currency.code === 'USD' ? '1'
                : currency.code === 'REF' ? formatRate(currency.rateAgainstUSD)
                : formatRate(currency.rateAgainstUSD)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currency.code === 'USD' ? 'USD/USD'
                : currency.code === 'REF' ? 'USD/USD3500'
                : (currency.usdFormat || '-')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatRate(currency.rateAgainstARS)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currency.code === 'REF' ? 'USD3500/ARS' : (currency.arsFormat || '-')}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formattedDateTime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyCard;