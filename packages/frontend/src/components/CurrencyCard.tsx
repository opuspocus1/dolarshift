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
  const meta = currencyMeta[currency.codigomoneda || currency.code] || currencyMeta.DEFAULT;

  // Formatear la fecha y hora como "Última Actualización: dd-mmm-yy hh:mm"
  let formattedDate = 'N/A';
  if (currency.date) {
    const dateObj = parseISO(currency.date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const year = dateObj.getFullYear().toString().slice(-2);
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  // Formatear la tasa de cambio con punto como separador de miles y dos decimales
  const formatRate = (rate: number | string | null | undefined) => {
    if (rate === null || rate === undefined || rate === '-') return '-';
    const num = Number(rate);
    if (isNaN(num)) return '-';
    return num.toLocaleString('en-US', {
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
        {/* Mostrar ambos valores en una sola fila, sin labels */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
              {formatRate(currency.rateAgainstUSD)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
              {formatRate(currency.rateAgainstARS)}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Última Actualización</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyCard;