import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyCard from '../components/CurrencyCard';
import ScrollToTop from '../components/ScrollToTop';
import CacheInfo from '../components/CacheInfo';
import CacheWarmingStatus from '../components/CacheWarmingStatus';
import { exchangeService, ExchangeRate } from '../services/exchangeService';
import { format, subDays, isWeekend } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CurrencyTable from '../components/CurrencyTable';
import { Table, LayoutGrid, Loader2 } from 'lucide-react';

const CARDS_PER_PAGE = 16;

// Estado inicial de viewMode desde localStorage
const getInitialViewMode = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dolarshift_viewMode');
    if (saved === 'cards' || saved === 'table') return saved;
  }
  return 'table';
};

// Estado inicial de page desde localStorage
const getInitialPage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dolarshift_page');
    const num = Number(saved);
    if (!isNaN(num) && num > 0) return num;
  }
  return 1;
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cards, setCards] = useState<ExchangeRate[]>([]);
  const [date, setDate] = useState<string>(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(getInitialPage);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<{ code: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(getInitialViewMode);
  const [baseCurrency, setBaseCurrency] = useState<string>('');
  const isFirstRender = useRef(true);

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
      const fetchDate = dateOverride || date;
      console.log('[Dashboard] Fetching rates for', fetchDate);
      // Pedir cotizaciones para la fecha seleccionada
      const rates = await exchangeService.getExchangeRates(new Date(fetchDate));
      console.log('[Dashboard] Rates received:', rates);
      setCards(rates);
      setDate(rates.length > 0 ? rates[0].date : fetchDate);
      setError(null);
      // Si después de las 10am no hay cotizaciones, mostrar mensaje especial
      const hour = new Date(fetchDate).getHours();
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
    // Siempre hacer fetch al cargar la página
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
    USD: 'US', EUR: 'EU', ARS: 'AR', BRL: 'BR', GBP: 'GB', JPY: 'JP', CNY: 'CN', CHF: 'CH', AUD: 'AU', CAD: 'CA', NZD: 'NZ', MXP: 'MX', CLP: 'CL', PEN: 'PE', UYU: 'UY', COP: 'CO', PYG: 'PY', BOB: 'BO', RUB: 'RU', SEK: 'SE', NOK: 'NO', DKK: 'DK', CZK: 'CZ', HUF: 'HU', TRY: 'TR', ILS: 'IL', INR: 'IN', ZAR: 'ZA', SGD: 'SG', HKD: 'HK', CNH: 'CN', AWG: 'AW',
    VEB: 'VE', // Venezuela
    VND: 'VN', // Vietnam
    RSD: 'RS', // Serbia
    NIO: 'NI'  // Nicaragua
  };

  // Cambiar la lógica de uso de baseCurrency: si baseCurrency es vacío, usar USD por defecto en la lógica de la tabla y cards
  const effectiveBaseCurrency = baseCurrency || 'USD';

  // Utilidad para buscar el último día hábil anterior con datos
  async function getLastBusinessDayWithData(currency, base, today) {
    let date = subDays(today, 1);
    let tries = 0;
    while (tries < 10) { // Máximo 10 días hacia atrás
      if (!isWeekend(date)) {
        const history = await exchangeService.getExchangeRateHistory(currency, date, date);
        if (history && history.length > 0 && history[0].buy) {
          // Para USD base, usar buy; para ARS base, usar tipocotizacion
          return { date, value: history[0].buy };
        }
      }
      date = subDays(date, 1);
      tries++;
    }
    return null;
  }

  // Hook para cargar variaciones diarias para todas las divisas mostradas (versión robusta)
  function useHistoricalVariations(codes, baseCurrency) {
    const [variations, setVariations] = useState({});
    const [loadingVariations, setLoadingVariations] = useState(false);
    const cache = React.useRef({}); // cache en memoria por sesión
    useEffect(() => {
      const cacheKey = baseCurrency + '|' + codes.join(',');
      if (cache.current[cacheKey]) {
        setVariations(cache.current[cacheKey]);
        setLoadingVariations(false);
        return;
      }
      setLoadingVariations(true);
      async function fetchVariations() {
        const today = new Date();
        const desde = new Date(today);
        desde.setDate(desde.getDate() - 370); // Pedir 370 días para cubrir mensual e interanual
        
        const startDate = desde.toISOString().slice(0, 10);
        const endDate = today.toISOString().slice(0, 10);
        
        const result = {};
        let usdHistory = [];
        
        try {
          // Usar el método optimizado para obtener todos los datos de una vez
          const bulkHistory = await exchangeService.getBulkChartHistory(startDate, endDate);
          console.log('[Depuración][bulkData]', bulkHistory);
          
          if (baseCurrency === 'USD') {
            usdHistory = bulkHistory['USD'] || [];
          }
          
          for (const code of codes) {
            try {
              const history = bulkHistory[code] || [];
              const diasConDatos = (history || []).filter(h => h.buy != null).sort((a, b) => new Date(a.date) - new Date(b.date));
              console.log(`[Variaciones][${code}] históricos recibidos:`, Array.isArray(history) ? history.length : 0, 'con datos:', diasConDatos.length);
              if (diasConDatos.length === 0) {
                console.warn(`[Variaciones][${code}] Sin datos suficientes para calcular variaciones. history:`, history);
                result[code] = { dayValue: null, dayPercent: null, weekPercent: null, monthPercent: null, ytdPercent: null, yoyPercent: null };
                continue;
              }
              if (code === 'AWG') {
                console.log(`[Depuración][AWG] diasConDatos:`, diasConDatos);
              }
              // Usar la última fecha con datos como referencia de 'hoy'
              const actual = diasConDatos[diasConDatos.length - 1];
              if (code === 'AWG') {
                console.log(`[Depuración][AWG] actual:`, actual);
              }
              let actualValue;
              if (baseCurrency === 'USD') {
                const usd = (usdHistory || []).find(u => u.date === actual.date);
                actualValue = usd && usd.buy ? actual.buy / usd.buy : null;
              } else {
                actualValue = actual.buy;
              }
              function getClosestValue(targetDateStr) {
                const target = new Date(targetDateStr);
                for (let i = diasConDatos.length - 1; i >= 0; i--) {
                  const d = new Date(diasConDatos[i].date);
                  if (d <= target) {
                    if (baseCurrency === 'USD') {
                      const usd = (usdHistory || []).find(u => u.date === diasConDatos[i].date);
                      return usd && usd.buy ? diasConDatos[i].buy / usd.buy : null;
                    } else {
                      return diasConDatos[i].buy;
                    }
                  }
                }
                return null;
              }
              const weekAgo = new Date(actual.date); weekAgo.setDate(weekAgo.getDate() - 7);
              const weekValue = getClosestValue(weekAgo.toISOString().slice(0, 10));
              const monthAgo = new Date(actual.date); monthAgo.setDate(monthAgo.getDate() - 30);
              const monthValue = getClosestValue(monthAgo.toISOString().slice(0, 10));
              const year = new Date(actual.date).getFullYear();
              const ytdValue = (() => {
                for (let i = 0; i < diasConDatos.length; i++) {
                  const d = new Date(diasConDatos[i].date);
                  if (d.getFullYear() === year) {
                    if (baseCurrency === 'USD') {
                      const usd = (usdHistory || []).find(u => u.date === diasConDatos[i].date);
                      return usd && usd.buy ? diasConDatos[i].buy / usd.buy : null;
                    } else {
                      return diasConDatos[i].buy;
                    }
                  }
                }
                return null;
              })();
              const yearAgo = new Date(actual.date); yearAgo.setDate(yearAgo.getDate() - 365);
              const yoyValue = getClosestValue(yearAgo.toISOString().slice(0, 10));
              let dayValue = null, dayPercent = null;
              if (diasConDatos.length >= 2) {
                let valores = [];
                if (baseCurrency === 'USD') {
                  valores = diasConDatos.map(h => {
                    const usd = (usdHistory || []).find(u => u.date === h.date);
                    if (usd && usd.buy) {
                      return h.buy / usd.buy;
                    }
                    return null;
                  }).filter(v => v !== null);
                } else {
                  valores = diasConDatos.map(h => h.buy);
                }
                if (valores.length >= 2) {
                  dayValue = valores[valores.length - 1] - valores[valores.length - 2];
                  dayPercent = (dayValue / valores[valores.length - 2]) * 100;
                } else {
                  console.warn(`[Variaciones][${code}] No hay suficientes valores para calcular variación diaria. valores:`, valores);
                }
              } else {
                console.warn(`[Variaciones][${code}] No hay suficientes días con datos para variación diaria. diasConDatos:`, diasConDatos);
              }
              const weekPercent = weekValue ? ((actualValue - weekValue) / weekValue) * 100 : null;
              const monthPercent = monthValue ? ((actualValue - monthValue) / monthValue) * 100 : null;
              const ytdPercent = ytdValue ? ((actualValue - ytdValue) / ytdValue) * 100 : null;
              const yoyPercent = yoyValue ? ((actualValue - yoyValue) / yoyValue) * 100 : null;
              result[code] = { dayValue, dayPercent, weekPercent, monthPercent, ytdPercent, yoyPercent };
            } catch (e) {
              console.error(`[Variaciones][${code}] Error calculando variaciones:`, e);
              result[code] = { dayValue: null, dayPercent: null, weekPercent: null, monthPercent: null, ytdPercent: null, yoyPercent: null };
            }
          }
        } catch (error) {
          console.error('Error fetching bulk history:', error);
          // Fallback: marcar todas las variaciones como null
          for (const code of codes) {
            result[code] = { dayValue: null, dayPercent: null, weekPercent: null, monthPercent: null, ytdPercent: null, yoyPercent: null };
          }
        }
        
        cache.current[cacheKey] = result; // guardar en cache
        setVariations(result);
        setLoadingVariations(false);
      }
      fetchVariations();
    }, [codes.join(','), baseCurrency]);
    return { variations, loadingVariations };
  }

  // En el componente Dashboard:
  const codesForTable = paginatedCards.map(card => card.code);
  const { variations: dailyVariations, loadingVariations } = useHistoricalVariations(codesForTable, effectiveBaseCurrency);

  // Mapeo para la tabla: una fila por divisa según la base seleccionada
  console.log('[Dashboard] dailyVariations:', dailyVariations);
  const tableDataSingle = paginatedCards.map(card => {
    let pair;
    let name = card.name;
    if (card.code === 'REF') {
      pair = `USD3500/${effectiveBaseCurrency}`;
      name = 'DOLAR USA COM 3500';
    } else {
      pair = `${card.code}/${effectiveBaseCurrency}`;
    }
    // Variaciones
    const variation = dailyVariations[card.code] || {};
    return {
      code: card.code,
      name: name,
      flagCode: card.code === 'XAG' || card.code === 'XAU' || card.code === 'XDR' ? undefined : currencyToCountry[card.code],
      customIcon: card.code === 'XAG' ? '🥈' : card.code === 'XAU' ? '🥇' : card.code === 'XDR' ? '💱' : undefined,
      value: card.buy,
      label: `${pair} ${name}`,
      date: card.date ? new Date(card.date).toLocaleDateString('es-AR') : '',
      dayValue: variation.dayValue,
      dayPercent: variation.dayPercent,
      weekPercent: variation.weekPercent,
      monthPercent: variation.monthPercent,
      ytdPercent: variation.ytdPercent,
      yoyPercent: variation.yoyPercent
    };
  });

  // Guardar en localStorage cuando cambia viewMode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dolarshift_viewMode', viewMode);
    }
  }, [viewMode]);

  // Guardar en localStorage cuando cambia page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dolarshift_page', String(page));
    }
  }, [page]);

  // Resetear página a 1 si cambian filtros, búsqueda o cantidad de páginas, excepto en el primer render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dolarshift_page', '1');
    }
  }, [search, selectedCurrencies, totalPages]);

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
        {/* Píldoras de filtro (independiente del layout de controles) */}
        <div className="mb-2 min-h-[2.5rem] flex flex-wrap gap-1">
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
        {/* Controles de búsqueda y moneda base */}
        <div className="mb-4 flex flex-col md:flex-row md:items-end gap-4">
          <div className="relative">
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
          <div className="md:w-72 min-w-[18rem]">
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="" disabled hidden>Moneda Base</option>
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
          <>
            <div ref={cardsListRef} className="mb-8">
              <CurrencyTable data={tableDataSingle} loadingVariations={loadingVariations} />
            </div>
          </>
        ) : (
        <div ref={cardsListRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {paginatedCards.map((currency) => (
            <div
              key={currency.code}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/charts?currency=${currency.code}`)}
            >
                <CurrencyCard currency={currency} dayPercent={(dailyVariations[currency.code] || {}).dayPercent} loadingVariations={loadingVariations} />
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
      <CacheInfo />
      <CacheWarmingStatus />
    </div>
  );
};

export default Dashboard;