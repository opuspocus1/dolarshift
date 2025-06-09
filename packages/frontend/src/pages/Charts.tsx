import React, { useEffect, useState } from 'react';
import ChartCard from '../components/ChartCard';
import { exchangeService, ExchangeRateHistory } from '../services/exchangeService';
import { subDays } from 'date-fns';

const chartPairs = [
  { code: 'USD', label: 'USD/ARS', color: '#3b82f6' },
  { code: 'EUR', label: 'EUR/ARS', color: '#ef4444' },
  { code: 'GBP', label: 'GBP/ARS', color: '#10b981' },
  { code: 'BTC', label: 'BTC/ARS', color: '#f59e0b' }
];

const Charts: React.FC = () => {
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const end = new Date();
      const start = subDays(end, 30);
      const result: Record<string, ExchangeRateHistory[]> = {};
      for (const pair of chartPairs) {
        try {
          result[pair.code] = await exchangeService.getExchangeRateHistory(pair.code, start, end);
        } catch (e) {
          result[pair.code] = [];
        }
      }
      setHistories(result);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exchange Rate Charts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Interactive charts showing currency trends and movements</p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartPairs.map((pair, idx) => (
            <ChartCard
              key={pair.code}
              title={`${pair.label} - 30 Day Trend`}
              data={
                (histories[pair.code] || []).map(item => ({
                  date: item.date,
                  value: item.sell ?? 0,
                  timestamp: Date.parse(item.date)
                }))
              }
              color={pair.color}
              height={350}
            />
          ))}
        </div>

        {/* Chart Legend */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chart Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">How to Read the Charts</h4>
              <ul className="space-y-1">
                <li>• Hover over any point to see exact values</li>
                <li>• Green trends indicate appreciation</li>
                <li>• Red trends indicate depreciation</li>
                <li>• Data represents closing rates for each day</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Currency Pairs Explained</h4>
              <ul className="space-y-1">
                <li>• <strong>USD/ARS:</strong> US Dollar to Argentine Peso</li>
                <li>• <strong>EUR/USD:</strong> Euro to US Dollar</li>
                <li>• <strong>GBP/USD:</strong> British Pound to US Dollar</li>
                <li>• <strong>BTC/USD:</strong> Bitcoin to US Dollar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;