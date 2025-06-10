import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ExchangeRate } from '../services/exchangeService';

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
  BTC: { flag: '₿', symbol: '₿' },
  // ... agregar más si querés
};

interface CurrencyCardProps {
  currency: ExchangeRate;
  baseCurrency?: string;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, baseCurrency = 'ARS' }) => {
  const isPositive = currency.changePercent ? currency.changePercent >= 0 : false;
  const meta = currencyMeta[currency.code] || { flag: '🏳️', symbol: currency.code };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl md:text-3xl lg:text-4xl">{meta.flag}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <span>{currency.code}</span>
              <span className="text-base text-gray-500 dark:text-gray-400">{meta.symbol}</span>
            </h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{currency.name}</p>
          </div>
        </div>
        {currency.changePercent !== undefined && (
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`} title="Variación diaria">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Compra</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currency.buy !== null && currency.buy !== undefined ? `${meta.symbol}${currency.buy.toLocaleString()}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Venta</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currency.sell !== null && currency.sell !== undefined ? `${meta.symbol}${currency.sell.toLocaleString()}` : 'N/A'}
            </p>
          </div>
        </div>
        {currency.changePercent !== undefined && (
          <div className="flex items-center space-x-2 mt-2">
            <span className={`text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              title="Variación diaria">
              {isPositive ? '+' : ''}{currency.change?.toFixed(2)}
            </span>
            <span className={`text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              title="Variación diaria">
              ({isPositive ? '+' : ''}{currency.changePercent?.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyCard;