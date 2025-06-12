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

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, baseCurrency = 'ARS' }) => {
  // Usar solo el código de moneda, sin bandera
  const meta = currencyMeta[currency.codigomoneda || currency.code] || currencyMeta.DEFAULT;

  // Formatear la fecha usando parseISO para evitar desfase horario
  const formattedDate = currency.date 
    ? format(parseISO(currency.date), "d 'de' MMMM 'de' yyyy", { locale: es })
    : 'N/A';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Mostrar solo el código de moneda, sin símbolo */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <span>{currency.codigomoneda || currency.code}</span>
          </h3>
        <div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{currency.descripcion || currency.name}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de Pase</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {currency.tipopase !== undefined && currency.tipopase !== null && currency.tipopase !== 0
                ? currency.tipopase
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cotización</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {currency.tipocotizacion !== undefined && currency.tipocotizacion !== null 
                ? Number(currency.tipocotizacion).toLocaleString(undefined, { maximumFractionDigits: 0 })
                : 'N/A'}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formattedDate}
          </p>
          </div>
      </div>
    </div>
  );
};

export default CurrencyCard;