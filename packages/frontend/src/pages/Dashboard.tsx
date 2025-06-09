import React from 'react';
import CurrencyCard from '../components/CurrencyCard';
import ChartCard from '../components/ChartCard';
import { mockRates, mockHistoricalData } from '../data/mockRates';

const Dashboard: React.FC = () => {
  const majorCurrencies = mockRates.slice(0, 4);
  const usdArsData = mockHistoricalData.find(data => data.currency === 'USD/ARS')?.data || [];
  const btcData = mockHistoricalData.find(data => data.currency === 'BTC/USD')?.data || [];

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
            data={usdArsData}
            color="#ef4444"
          />
          <ChartCard
            title="BTC/USD Price Trend (30 Days)"
            data={btcData}
            color="#f59e0b"
          />
        </div>

        {/* Additional Currency Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRates.slice(4).map((currency) => (
            <CurrencyCard key={currency.code} currency={currency} />
          ))}
        </div>

        {/* Market Summary */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {mockRates.filter(rate => rate.changePercent > 0).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currencies Up</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {mockRates.filter(rate => rate.changePercent < 0).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currencies Down</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {mockRates.filter(rate => rate.changePercent === 0).length}
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