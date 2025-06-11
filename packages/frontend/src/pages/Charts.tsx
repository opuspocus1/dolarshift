import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChartCard from '../components/ChartCard';
import ScrollToTop from '../components/ScrollToTop';
import { exchangeService, ExchangeRateHistory } from '../services/exchangeService';
import { subDays } from 'date-fns';

const chartPairs = [
  { code: 'USD', label: 'USD/ARS', color: '#3b82f6' },
  { code: 'EUR', label: 'EUR/ARS', color: '#ef4444' },
  { code: 'GBP', label: 'GBP/ARS', color: '#10b981' },
  { code: 'BTC', label: 'BTC/ARS', color: '#f59e0b' }
];

const Charts: React.FC = () => {
  const { t } = useTranslation();
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('charts.title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('charts.subtitle')}</p>
        </div>
        {/* Chart Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {chartPairs.map(pair => (
            <ChartCard
              key={pair.code}
              title={t(`charts.pair.${pair.code}`, { defaultValue: pair.label })}
              data={histories[pair.code] || []}
              color={pair.color}
            />
          ))}
        </div>
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('charts.infoTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('charts.howToReadTitle')}</h4>
              <ul className="space-y-1">
                <li>• {t('charts.howToRead1')}</li>
                <li>• {t('charts.howToRead2')}</li>
                <li>• {t('charts.howToRead3')}</li>
                <li>• {t('charts.howToRead4')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('charts.pairsTitle')}</h4>
              <ul className="space-y-1">
                <li>• <strong>USD/ARS:</strong> {t('charts.pairDesc.USDARS')}</li>
                <li>• <strong>EUR/USD:</strong> {t('charts.pairDesc.EURUSD')}</li>
                <li>• <strong>GBP/USD:</strong> {t('charts.pairDesc.GBPUSD')}</li>
                <li>• <strong>BTC/USD:</strong> {t('charts.pairDesc.BTCUSD')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Charts;