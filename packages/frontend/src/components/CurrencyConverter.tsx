import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { exchangeService, ExchangeRate } from '../services/exchangeService';

const CurrencyConverter: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('ARS');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await exchangeService.getLatestExchangeRates();
        setRates(data);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[CurrencyConverter] Error al obtener latest rates:', err);
        }
        setRates([]);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const fromRate = rates.find(r => r.code === from)?.sell || 1;
    const toRate = rates.find(r => r.code === to)?.sell || 1;
    const convertedAmount = numAmount * (fromRate / toRate);
    setResult(convertedAmount);
  }, [amount, from, to, rates]);

  const swapCurrencies = () => {
    setFrom(to);
    setTo(from);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const currenciesWithRates = rates.filter(currency => currency.buy !== null || currency.sell !== null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Currency Converter</h3>
      
      <div className="space-y-4">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
          <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 w-full"
            >
              {currenciesWithRates.map(rate => (
                <option key={rate.code} value={rate.code}>
                  {rate.code} - {rate.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="md:w-24 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder="Amount"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors duration-200"
          >
            <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
          <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 w-full"
            >
              {currenciesWithRates.map(rate => (
                <option key={rate.code} value={rate.code}>
                  {rate.code} - {rate.name}
                </option>
              ))}
            </select>
            <div className="md:w-24 w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-right font-medium text-gray-900 dark:text-white">
              {result?.toLocaleString('en-US', { 
                maximumFractionDigits: 0 
              })}
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            1 {from} = {((rates.find(r => r.code === from)?.sell || 1) / (rates.find(r => r.code === to)?.sell || 1)).toLocaleString('en-US', { 
              maximumFractionDigits: 0 
            })} {to}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;