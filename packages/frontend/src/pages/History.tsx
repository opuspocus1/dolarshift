import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { exchangeService, ExchangeRateHistory } from '../services/exchangeService';
import { Currency } from '../types';

const History: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD']);
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periods = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '3 Months' },
    { value: '365', label: '1 Year' }
  ];

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

  // Combina todas las series en un array de objetos {date, ...moneda1, ...moneda2, ...}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historical Exchange Rates</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Compare the evolution of multiple currencies over time</p>
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

        {/* Period select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </div>

        {/* Chart */}
        <ChartCard
          title={`Histórico de ${selectedCurrencies.join(', ')}`}
          data={chartData}
          selectedCurrencies={selectedCurrencies}
          height={400}
        />
      </div>
    </div>
  );
};

export default History;