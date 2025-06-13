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

  const options = otherCurrencies.map(currency => ({
    value: currency.code,
    label: `${currency.code}/${baseCurrency} - ${currency.name}`,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <ScrollToTop />
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('charts.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">{t('charts.description')}</p>
      </div>

      {/* Filtros compactos en una sola fila */}
      <div className="flex flex-col md:flex-row md:items-end md:space-x-4 mb-6 gap-4 bg-white dark:bg-[#181e29] border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors duration-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Moneda base</label>
          <select
            value={baseCurrency}
            onChange={e => setBaseCurrency(e.target.value)}
            className="w-full p-2 border border-gray-700 bg-[#181e29] text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code} className="bg-[#181e29] text-white">
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t('charts.selectCurrencies')}</label>
          {otherCurrencies.length > 0 && (
            <Select
              isMulti
              options={options}
              classNamePrefix="react-select-dark"
              className="min-w-[220px] text-white"
              styles={{
                control: (base) => ({ ...base, backgroundColor: '#181e29', borderColor: '#334155', color: '#fff' }),
                menu: (base) => ({ ...base, backgroundColor: '#181e29', color: '#fff' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#334155' : '#181e29', color: '#fff' }),
                multiValue: (base) => ({ ...base, backgroundColor: '#334155' }),
                multiValueLabel: (base) => ({ ...base, color: '#fff' }),
                input: (base) => ({ ...base, color: '#fff' }),
                singleValue: (base) => ({ ...base, color: '#fff' }),
                placeholder: (base) => ({ ...base, color: '#94a3b8' }),
              }}
              placeholder="Otras monedas..."
              onChange={(selectedOptions: MultiValue<{ value: string; label: string }>) => {
                setSelectedCurrencies((selectedOptions || []).map(opt => opt.value));
              }}
              value={options.filter(opt => selectedCurrencies.includes(opt.value))}
              />
          )}
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
            selectedCurrencies={selectedCurrencies}
            baseCurrency={baseCurrency}
          />
        </div>
      )}
    </div>
  );
};

export default Charts;