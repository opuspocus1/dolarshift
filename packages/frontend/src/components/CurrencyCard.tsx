import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ExchangeRate } from '../services/exchangeService';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface CurrencyCardProps {
  currency: ExchangeRate;
  baseCurrency?: string;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, baseCurrency = 'USD' }) => {
  // Usar solo el código de moneda, sin bandera
  const meta = currencyMeta[currency.codigomoneda || currency.code] || currencyMeta.DEFAULT;

  // Formatear la fecha y hora usando parseISO para evitar desfase horario
  const formattedDateTime = currency.date 
    ? format(parseISO(currency.date), "d 'de' MMMM 'de' yyyy HH:mm", { locale: es })
    : 'N/A';

  // Formatear la tasa de cambio
  const formatRate = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined) return '-';
    return Number(rate).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Determinar el formato de cotización
  const getRateFormat = () => {
    if (currency.code === 'USD') return 'USD/ARS';
    return currency.isUsdQuoted ? `${currency.code}/USD` : `USD/${currency.code}`;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>{currency.codigomoneda || currency.code}</span>
          </h3>
          <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{currency.descripcion || currency.name}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 mt-2">
        {/* Tasa relativa al USD */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatRate(currency.rateAgainstUSD)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currency.usdFormat || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatRate(currency.rateAgainstARS)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currency.arsFormat || '-'}
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