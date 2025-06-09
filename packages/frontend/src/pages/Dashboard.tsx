import React, { useEffect, useState } from 'react';
import CurrencyCard from '../components/CurrencyCard';
import ChartCard from '../components/ChartCard';
import { exchangeService, ExchangeRate, ExchangeRateHistory } from '../services/exchangeService';
import { format, subDays } from 'date-fns';
import { ChartDataPoint } from '../types';

const Dashboard: React.FC = () => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [usdHistory, setUsdHistory] = useState<ExchangeRateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let today = new Date();
        const now = new Date();
        // Si la fecha de hoy es futura, usar ayer
        if (today > now) {
          today = subDays(now, 1);
        }
        const thirtyDaysAgo = subDays(today, 30);

        // Fetch current rates
        const currentRates = await exchangeService.getExchangeRates(today);
        setRates(currentRates);

        // Fetch USD history
        const usdData = await exchangeService.getExchangeRateHistory('USD', thirtyDaysAgo, today);
        setUsdHistory(usdData);

        setError(null);
      } catch (err) {
        setError('Error loading data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const majorCurrencies = rates.slice(0, 4);
  const otherCurrencies = rates.slice(4);

  const chartData: ChartDataPoint[] = usdHistory.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    value: item.sell,
    timestamp: new Date(item.date).getTime()
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Currency Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Real-time exchange rates and market trends</p>
        </div>

        {/* Currency Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {majorCurrencies.map((currency) => (
            <CurrencyCard key={currency.code} currency={currency} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard
            title="USD/ARS Exchange Rate (30 Days)"
            data={chartData}
            color="#ef4444"
          />
        </div>

        {/* Additional Currency Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherCurrencies.map((currency) => (
            <CurrencyCard key={currency.code} currency={currency} />
          ))}
        </div>

        {/* Market Summary */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {rates.filter(rate => rate.changePercent && rate.changePercent > 0).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currencies Up</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {rates.filter(rate => rate.changePercent && rate.changePercent < 0).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currencies Down</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {rates.filter(rate => !rate.changePercent || rate.changePercent === 0).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unchanged</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;