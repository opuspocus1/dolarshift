import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyConverter from '../components/CurrencyConverter';
import ScrollToTop from '../components/ScrollToTop';
import { Calculator, TrendingUp, Clock } from 'lucide-react';
import { exchangeService, ExchangeRate } from '../services/exchangeService';
import { Currency } from '../types';

const Converter: React.FC = () => {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await exchangeService.getExchangeRates(new Date());
      setRates(data);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-8 w-8" />
            {t('converter.title')}
          </h1>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Buy</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sell</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currenciesWithRates.map((currency) => (
                      <tr key={currency.code}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {currency.code} - {currency.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                          {currency.buy?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                          {currency.sell?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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