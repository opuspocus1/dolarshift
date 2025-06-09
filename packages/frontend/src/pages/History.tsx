import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { exchangeService, ExchangeRateHistory } from '../services/exchangeService';
import { Currency } from '../types';

const History: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD/ARS');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [history, setHistory] = useState<ExchangeRateHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD']);
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});

  const periods = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '3 Months' },
    { value: '365', label: '1 Year' }
  ];

  const currentValue = 0;
  const previousValue = 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  useEffect(() => {
    const fetchCurrencies = async () => {
      const data = await exchangeService.getCurrencies();
      setCurrencies(data);
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(selectedPeriod, 10));
      const result: Record<string, ExchangeRateHistory[]> = {};
      for (const code of selectedCurrencies) {
        try {
          result[code] = await exchangeService.getExchangeRateHistory(code, start, end);
        } catch (e) {
          result[code] = [];
        }
      }
      setHistories(result);
      setLoading(false);
    };
    fetchAll();
  }, [selectedCurrencies, selectedPeriod]);

  // Para el gráfico, combino todas las series en un array de objetos {date, ...moneda1, ...moneda2, ...}
  const allDates = Array.from(new Set(Object.values(histories).flat().map(item => item.date))).sort();
  const chartData = allDates.map(date => {
    const entry: any = { date };
    for (const code of selectedCurrencies) {
      const found = histories[code]?.find(item => item.date === date);
      entry[code] = found ? found.sell ?? 0 : null;
    }
    return entry;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historical Data</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Analyze currency trends over different time periods</p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TrendingUp className="inline h-4 w-4 mr-1" />
                Currency Pair
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={`${currency.code}/${currency.code}`}>
                    {currency.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Multiselect de monedas */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monedas a mostrar</label>
          <select
            multiple
            value={selectedCurrencies}
            onChange={e => setSelectedCurrencies(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            style={{ minHeight: 120 }}
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
            ))}
          </select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Rate</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Period Change</h3>
            <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(4)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Percentage Change</h3>
            <p className={`text-2xl font-bold ${changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Points</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{0}</p>
          </div>
        </div>

        {/* Chart */}
        <ChartCard
          title={`${selectedCurrency} - ${periods.find(p => p.value === selectedPeriod)?.label} History`}
          data={chartData}
          color={changePercent >= 0 ? '#10b981' : '#ef4444'}
          height={400}
          selectedCurrencies={selectedCurrencies}
        />

        {/* Data Table */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historical Values</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Daily Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {history.slice(-10).reverse().map((item, index) => {
                  const previousItem = history[history.length - 1 - index - 1];
                  const dailyChange = previousItem ? item.sell - previousItem.sell : 0;
                  
                  return (
                    <tr key={item.date} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.sell.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        dailyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;