import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ExchangeRate } from '../services/exchangeService';

interface CurrencyCardProps {
  currency: ExchangeRate;
  baseCurrency?: string;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, baseCurrency = 'USD' }) => {
  const isPositive = currency.changePercent ? currency.changePercent >= 0 : false;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{currency.code}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{currency.name}</p>
        </div>
        {currency.changePercent !== undefined && (
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Compra</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currency.buy !== null && currency.buy !== undefined ? currency.code === 'BTC' ? `₿${currency.buy.toFixed(8)}` : `${currency.buy.toLocaleString()}` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Venta</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {currency.sell !== null && currency.sell !== undefined ? currency.code === 'BTC' ? `₿${currency.sell.toFixed(8)}` : `${currency.sell.toLocaleString()}` : 'N/A'}
            </p>
          </div>
        </div>
        
        {currency.changePercent !== undefined && (
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}{currency.change?.toFixed(2)}
            </span>
            <span className={`text-sm ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ({isPositive ? '+' : ''}{currency.changePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyCard;