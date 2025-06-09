import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { mockRates, convertCurrency } from '../data/mockRates';

const CurrencyConverter: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('ARS');
  const [amount, setAmount] = useState<string>('100');
  const [result, setResult] = useState<number>(0);

  const currencies = mockRates.map(rate => ({
    code: rate.code,
    name: rate.name
  }));

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    const convertedAmount = convertCurrency(numAmount, fromCurrency, toCurrency);
    setResult(convertedAmount);
  }, [amount, fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Currency Converter</h3>
      
      <div className="space-y-4">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
          <div className="flex space-x-2">
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
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
          <div className="flex space-x-2">
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <div className="w-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-right font-medium text-gray-900 dark:text-white">
              {result.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 8 
              })}
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            1 {fromCurrency} = {(result / (parseFloat(amount) || 1)).toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 8 
            })} {toCurrency}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;