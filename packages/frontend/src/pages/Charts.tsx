import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import ScrollToTop from '../components/ScrollToTop';
import { exchangeService, ExchangeRateHistory } from '../services/exchangeService';
import { Currency } from '../types';
import ExchangeRateChart from '../components/ExchangeRateChart';
import { format, subDays } from 'date-fns';

const Charts: React.FC = () => {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD']);
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forzar scroll al tope al montar la página
  useEffect(() => {
    window.history.scrollRestoration = "manual";
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 0);
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const availableCurrencies = await exchangeService.getAvailableCurrencies();
        setCurrencies(availableCurrencies);
      } catch (error) {
        console.error('Error fetching currencies:', error);
        setError('Failed to load currencies');
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchHistories = async () => {
      if (selectedCurrencies.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const newHistories: Record<string, ExchangeRateHistory[]> = {};
        
        for (const currency of selectedCurrencies) {
          const history = await exchangeService.getChartHistory(
            currency,
            startDate,
            endDate
          );
          newHistories[currency] = history;
        }

        setHistories(newHistories);
      } catch (error) {
        console.error('Error fetching histories:', error);
        setError('Failed to load exchange rate history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [selectedCurrencies, startDate, endDate]);

  // Función para alternar selección de moneda
  const toggleCurrency = (code: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ScrollToTop />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('charts.title')}</h1>
        <p className="text-gray-600">{t('charts.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('charts.selectCurrencies')}
          </label>
          <div className="flex flex-wrap gap-2 bg-gray-900 p-3 rounded-xl">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => toggleCurrency(currency.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none
                  ${selectedCurrencies.includes(currency.code)
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                style={{ minWidth: 60 }}
              >
                {currency.code}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('charts.dateRange')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <ExchangeRateChart
            histories={histories}
            selectedCurrencies={selectedCurrencies}
          />
        </div>
      )}
    </div>
  );
};

export default Charts;