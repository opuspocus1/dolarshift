import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyConverter from '../components/CurrencyConverter';
import ScrollToTop from '../components/ScrollToTop';
import { Calculator, TrendingUp, Clock } from 'lucide-react';
import { exchangeService } from '../services/exchangeService';
import { CurrencyRate, Currency } from '../types';

const Converter: React.FC = () => {
  const { t } = useTranslation();
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await exchangeService.getExchangeRates(new Date());
      setRates(data.map(rate => ({
        ...rate,
        change: rate.change ?? 0,
        changePercent: rate.changePercent ?? 0
      })));
    };

    const fetchCurrencies = async () => {
      const data = await exchangeService.getCurrencies();
      setCurrencies(data);
    };

    fetchRates();
    fetchCurrencies();
  }, []);

  const currenciesWithRates = rates.filter(currency => currency.buy !== null || currency.sell !== null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('converter.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('converter.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Converter */}
          <div className="lg:col-span-2">
            <CurrencyConverter />
            
            {/* Exchange Rate Table */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Current Exchange Rates
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rate (USD)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        24h Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currenciesWithRates.map((currency) => (
                      <tr key={currency.code} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{currency.code}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{currency.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {currency.sell !== null && currency.sell !== undefined ? currency.sell.toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            currency.changePercent >= 0 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {currency.changePercent >= 0 ? '+' : ''}{currency.changePercent.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Converter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                {t('converter.quickConvert')}
              </h3>
              <CurrencyConverter />
            </div>

            {/* Top Movers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {t('converter.topMovers')}
              </h3>
              <div className="space-y-3">
                {currenciesWithRates.map((currency) => (
                  <div key={currency.code} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{currency.code}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      currency.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {currency.changePercent >= 0 ? '+' : ''}{currency.changePercent.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Market Status
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Live</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Market:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">Open</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Mock API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Converter;