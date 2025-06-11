import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import ScrollToTop from '../components/ScrollToTop';
import { exchangeService, ExchangeRateHistory } from '../services/exchangeService';
import { Currency } from '../types';
import ExchangeRateChart from '../components/ExchangeRateChart';
import { format, subDays, parse } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Charts: React.FC = () => {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD']);
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('ARS');

  // Convertir string a Date para DatePicker
  const startDateObj = parse(startDate, 'yyyy-MM-dd', new Date());
  const endDateObj = parse(endDate, 'yyyy-MM-dd', new Date());

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

  // Dividir monedas: 4 principales y el resto
  const mainCurrencies = currencies.slice(0, 4);
  const otherCurrencies = currencies.slice(4);
  const [selectedDropdown, setSelectedDropdown] = useState<string>('');

  // Cuando seleccionan del dropdown, agregar a la selección
  useEffect(() => {
    if (selectedDropdown && !selectedCurrencies.includes(selectedDropdown)) {
      setSelectedCurrencies(prev => [...prev, selectedDropdown]);
    }
    // eslint-disable-next-line
  }, [selectedDropdown]);

  return (
    <div className="container mx-auto px-4 py-8">
      <ScrollToTop />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('charts.title')}</h1>
        <p className="text-gray-600">{t('charts.description')}</p>
      </div>

      {/* Selector de moneda base */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda base</label>
        <select
          value={baseCurrency}
          onChange={e => setBaseCurrency(e.target.value)}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('charts.selectCurrencies')}
          </label>
          <div className="flex flex-wrap gap-2 bg-gray-900 p-3 rounded-xl">
            {mainCurrencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                onClick={() => toggleCurrency(currency.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus:outline-none
                  ${selectedCurrencies.includes(currency.code)
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
                style={{ minWidth: 120 }}
              >
                {currency.code}/{baseCurrency} - {currency.name}
              </button>
            ))}
            {/* Dropdown para el resto de monedas */}
            {otherCurrencies.length > 0 && (
              <select
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-800 text-gray-200 border border-gray-700"
                value={selectedDropdown}
                onChange={e => setSelectedDropdown(e.target.value)}
                style={{ minWidth: 180 }}
              >
                <option value="">Otras monedas...</option>
                {otherCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}/{baseCurrency} - {currency.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('charts.dateRange')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                selected={startDateObj}
                onChange={date => setStartDate(format(date as Date, 'yyyy-MM-dd'))}
                dateFormat="dd/MM/yyyy"
                className="w-full p-2 border border-gray-300 rounded-md"
                calendarClassName="bg-white"
              />
            </div>
            <div>
              <DatePicker
                selected={endDateObj}
                onChange={date => setEndDate(format(date as Date, 'yyyy-MM-dd'))}
                dateFormat="dd/MM/yyyy"
                className="w-full p-2 border border-gray-300 rounded-md"
                calendarClassName="bg-white"
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
            baseCurrency={baseCurrency}
          />
        </div>
      )}
    </div>
  );
};

export default Charts;