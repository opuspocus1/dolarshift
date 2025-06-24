import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyCard from '../components/CurrencyCard';
import ScrollToTop from '../components/ScrollToTop';
import { exchangeService, ExchangeRate } from '../services/exchangeService';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CurrencyTable from '../components/CurrencyTable';
import { Table, LayoutGrid } from 'lucide-react';

const CARDS_PER_PAGE = 16;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cards, setCards] = useState<ExchangeRate[]>([]);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<{ code: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'ARS'>('USD');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Handler para el selector de fecha
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedDate(value);
    fetchData(value);
  };

  // Función para obtener cotizaciones según la fecha
  const fetchData = async (dateOverride?: string) => {
      try {
        setLoading(true);
      // Pedir cotizaciones para la fecha seleccionada
      const rates = await exchangeService.getExchangeRates(new Date(dateOverride || date));
      setCards(rates);
      setDate(rates.length > 0 ? rates[0].date : dateOverride || date);
      setError(null);
      // Si después de las 10am no hay cotizaciones, mostrar mensaje especial
      const hour = new Date(date).getHours();
      if (rates.length === 0 && hour >= 10 && hour < 18) {
        setError('Aún no hay cotizaciones publicadas para hoy. El mercado abre a las 10am. Si es después de las 12pm y no ves datos, probá seleccionar el día anterior.');
      }
      } catch (err) {
      console.error('[Dashboard] Error real al cargar cotizaciones:', err);
      setError('Error cargando datos. Intente nuevamente.');
      setCards([]);
      setDate('');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtro de búsqueda
  const filteredCards = selectedCurrencies.length > 0
    ? cards.filter(card => selectedCurrencies.some(sel => sel.code === card.code))
    : cards.filter(card =>
        card.code.toLowerCase().includes(search.toLowerCase()) ||
        card.name.toLowerCase().includes(search.toLowerCase())
      );

  // Paginación
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const paginatedCards = filteredCards.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE);

  // Manejo de cierre del dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Opciones para el dropdown
  const currencyOptions = cards.map(card => ({
    code: card.code,
    name: card.name
  }));
  const filteredOptions = search
    ? currencyOptions.filter(option =>
        option.code.toLowerCase().includes(search.toLowerCase()) ||
        option.name.toLowerCase().includes(search.toLowerCase())
      ).filter(option => !selectedCurrencies.some(sel => sel.code === option.code))
    : currencyOptions.filter(option => !selectedCurrencies.some(sel => sel.code === option.code));

  // Selección de una opción (multi)
  const handleSelectOption = (option: { code: string; name: string }) => {
    setSelectedCurrencies(prev => [...prev, option]);
    setSearch('');
    setShowDropdown(false);
    setPage(1);
  };

  // Quitar una divisa seleccionada
  const handleRemoveSelected = (code: string) => {
    setSelectedCurrencies(prev => prev.filter(sel => sel.code !== code));
    setPage(1);
  };

  // Cambios en el input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setShowDropdown(true);
    setPage(1);
  };

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Hacer scroll al final de la lista de cards al cambiar de página
  const cardsListRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (page > 1 && cardsListRef.current) {
      cardsListRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [page]);

  useEffect(() => {
    if (page > 1) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [page]);

  // Funciones para obtener los textos de par igual que en CurrencyCard
  function getUsdPair(card) {
    if (card.code === 'USD') return 'USD/USD';
    if (card.code === 'REF') return 'USD/USD3500';
    return card.usdFormat || '-';
  }
  function getArsPair(card) {
    if (card.code === 'REF') return 'USD3500/ARS';
    return card.arsFormat || '-';
  }

  // Mapeo de código de moneda a código de país para banderas (igual que en CurrencyCard)
  const currencyToCountry = {
    USD: 'US', EUR: 'EU', ARS: 'AR', BRL: 'BR', GBP: 'GB', JPY: 'JP', CNY: 'CN', CHF: 'CH', AUD: 'AU', CAD: 'CA', NZD: 'NZ', MXP: 'MX', CLP: 'CL', PEN: 'PE', UYU: 'UY', COP: 'CO', PYG: 'PY', BOB: 'BO', RUB: 'RU', SEK: 'SE', NOK: 'NO', DKK: 'DK', CZK: 'CZ', HUF: 'HU', TRY: 'TR', ILS: 'IL', INR: 'IN', ZAR: 'ZA', SGD: 'SG', HKD: 'HK', CNH: 'CN', AWG: 'AW'
  };

  // Mapeo para la tabla: una fila por divisa según la base seleccionada
  const tableDataSingle = paginatedCards.map(card => {
    const pair = `${card.code}/${baseCurrency}`;
    return {
      code: card.code,
      name: card.name,
      flagCode: card.code === 'XAG' || card.code === 'XAU' || card.code === 'XDR' ? undefined : currencyToCountry[card.code],
      customIcon: card.code === 'XAG' ? '🥈' : card.code === 'XAU' ? '🥇' : card.code === 'XDR' ? '💱' : undefined,
      value: baseCurrency === 'USD' ? (card.code === 'USD' ? 1 : card.code === 'REF' ? card.rateAgainstUSD : card.rateAgainstUSD) : card.rateAgainstARS,
      label: `${pair} ${card.name}`,
      date: card.date ? new Date(card.date).toLocaleDateString('es-AR') : ''
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Visualiza los tipos de cambio mayoristas de todas las divisas en relación al USD y al ARS</p>
          </div>
          <div className="mb-4 flex justify-between items-center">
            <input
              type="text"
              className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder={t('search')}
              disabled
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(CARDS_PER_PAGE)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => fetchData()}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Visualiza los tipos de cambio mayoristas de todas las divisas en relación al USD y al ARS</p>
        </div>
        {/* Controles de búsqueda y moneda base */}
        <div className="mb-4 flex flex-col md:flex-row md:items-end gap-4">
          <div className="relative">
            <div className="flex flex-wrap gap-1 mb-1">
              {selectedCurrencies.map(option => (
                <span key={option.code} className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                  {option.code} - {option.name}
                  <button
                    type="button"
                    className="ml-1 text-blue-500 hover:text-red-500 focus:outline-none"
                    onClick={() => handleRemoveSelected(option.code)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              ref={inputRef}
              type="text"
              className="w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              placeholder={t('search')}
              value={search}
              onChange={handleSearch}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
            {showDropdown && filteredOptions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {filteredOptions.map(option => (
                  <div
                    key={option.code}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white"
                    onClick={() => handleSelectOption(option)}
                  >
                    {option.code} - {option.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda Base</label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value as 'USD' | 'ARS')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="USD">USD (Dólar Estadounidense)</option>
              <option value="ARS">ARS (Peso Argentino)</option>
            </select>
          </div>
        </div>
        {/* Botón de alternar vista */}
        <div className="flex justify-end mb-2">
          <button
            className="flex items-center gap-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            aria-label="Alternar vista"
          >
            {viewMode === 'table' ? <LayoutGrid className="w-4 h-4" /> : <Table className="w-4 h-4" />}
            {viewMode === 'table' ? 'Vista de cuadrados' : 'Vista de tabla'}
          </button>
        </div>
        {/* Cards de monedas o tabla */}
        {viewMode === 'table' ? (
          <div ref={cardsListRef} className="mb-8">
            <CurrencyTable data={tableDataSingle} />
          </div>
        ) : (
          <div ref={cardsListRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {paginatedCards.map((currency) => (
              <div
                key={currency.code}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/charts?currency=${currency.code}`)}
              >
                <CurrencyCard currency={currency} />
              </div>
            ))}
          </div>
        )}
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
              onClick={handlePrev}
              disabled={page === 1}
            >
              {t('prev')}
            </button>
            <span className="text-gray-700 dark:text-gray-200">{page} / {totalPages}</span>
            <button
              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
              onClick={handleNext}
              disabled={page === totalPages}
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Dashboard;