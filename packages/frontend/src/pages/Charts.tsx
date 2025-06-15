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
import Select, { MultiValue } from 'react-select';
import { useLocation } from 'react-router-dom';
import { es } from 'date-fns/locale';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const Charts: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['USD']);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [histories, setHistories] = useState<Record<string, ExchangeRateHistory[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('ARS');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [viewMode, setViewMode] = useState<'USD' | 'ARS'>('USD');
  const [selectedDropdown, setSelectedDropdown] = useState('');

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
      if (!selectedCurrency) return;
      setLoading(true);
      setError(null);
      try {
        const newHistories: Record<string, ExchangeRateHistory[]> = {};
        // Siempre cargar el historial de la moneda seleccionada y USD y ARS
        const neededCodes = Array.from(new Set([selectedCurrency, 'USD', 'ARS']));
        for (const code of neededCodes) {
          const history = await exchangeService.getChartHistory(
            code,
            startDate,
            endDate
          );
          newHistories[code] = history;
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
  }, [selectedCurrency, startDate, endDate]);

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

  // Unir todas las monedas para el selector, asegurando que las seleccionadas estén presentes
  const allCurrencies = [...mainCurrencies, ...otherCurrencies];

  // Helper to build dashboard-like pairs
  const getDashboardPair = (code: string): string => {
    if (code === 'ARS') return 'ARS/USD';
    if (code === 'USD') return 'USD/USD';
    if (code === 'XAU' || code === 'XAG') return `${code}/USD`;
    return `USD/${code}`;
  };

  // Build options for single currency select
  const options = allCurrencies
    .filter((currency, idx, arr) => arr.findIndex(c => c.code === currency.code) === idx)
    .map(currency => ({
      value: currency.code,
      label: `${currency.code} - ${currency.name}`,
    }));

  // When navigating from dashboard, set selected currency and viewMode to USD
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currencyParam = params.get('currency');
    if (currencyParam) {
      setSelectedCurrency(currencyParam);
      setViewMode('USD'); // Always show left value (against USD) by default
    }
  }, [location.search]);

  // When selecting from filter, update selectedCurrencies as pairs
  const handleSelectChange = (selectedOptions: MultiValue<{ value: string; label: string }>) => {
    setSelectedCurrencies((selectedOptions || []).map(opt => opt.value));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ScrollToTop />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Histórico</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">Gráfico histórico de la tasa de cambio seleccionada.</p>
      </div>

      {/* Filtros compactos en una sola fila */}
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4 mb-6 gap-4 bg-white dark:bg-[#181e29] border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
          <select
            value={selectedCurrency}
            onChange={e => setSelectedCurrency(e.target.value)}
            className="w-full p-2 border border-gray-700 bg-[#181e29] text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#181e29] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px] flex items-end">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white">
              <input type="radio" name="viewMode" value="USD" checked={viewMode === 'USD'} onChange={() => setViewMode('USD')} />
              Ver contra USD
            </label>
            <label className="flex items-center gap-2 text-white">
              <input type="radio" name="viewMode" value="ARS" checked={viewMode === 'ARS'} onChange={() => setViewMode('ARS')} />
              Ver contra ARS
            </label>
          </div>
        </div>
        <div className="flex flex-1 flex-row gap-2 min-w-[200px]">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('charts.dateRange')}</label>
            <DatePicker
              selected={startDateObj}
              onChange={date => setStartDate(format(date as Date, 'yyyy-MM-dd'))}
              dateFormat="dd/MM/yyyy"
              className="w-full p-2 border border-gray-700 bg-[#181e29] text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              calendarClassName="bg-[#181e29] text-white"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              renderCustomHeader={({ date, changeYear, changeMonth }) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="bg-[#181e29] text-white border border-gray-700 rounded-md mr-2"
                  >
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={date.getMonth()}
                    onChange={({ target: { value } }) => changeMonth(Number(value))}
                    className="bg-[#181e29] text-white border border-gray-700 rounded-md"
                  >
                    {MONTHS_ES.map((month, i) => (
                      <option key={i} value={i}>{month}</option>
                    ))}
                  </select>
                </div>
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">&nbsp;</label>
            <DatePicker
              selected={endDateObj}
              onChange={date => setEndDate(format(date as Date, 'yyyy-MM-dd'))}
              dateFormat="dd/MM/yyyy"
              className="w-full p-2 border border-gray-700 bg-[#181e29] text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              calendarClassName="bg-[#181e29] text-white"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              renderCustomHeader={({ date, changeYear, changeMonth }) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="bg-[#181e29] text-white border border-gray-700 rounded-md mr-2"
                  >
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={date.getMonth()}
                    onChange={({ target: { value } }) => changeMonth(Number(value))}
                    className="bg-[#181e29] text-white border border-gray-700 rounded-md"
                  >
                    {MONTHS_ES.map((month, i) => (
                      <option key={i} value={i}>{month}</option>
                    ))}
                  </select>
                </div>
              )}
            />
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
        <div className="bg-white dark:bg-[#181e29] border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-4 transition-colors duration-200">
          <ExchangeRateChart
            histories={histories}
            selectedCurrency={selectedCurrency}
            viewMode={viewMode}
          />
        </div>
      )}
    </div>
  );
};

export default Charts;