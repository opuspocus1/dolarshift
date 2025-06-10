import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CurrencyCard from '../components/CurrencyCard';
import { exchangeService, ExchangeRate } from '../services/exchangeService';
import { format, subDays } from 'date-fns';

const CARDS_PER_PAGE = 16;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<ExchangeRate[]>([]);
  const [date, setDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>('');

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
      // Obtener la fecha actual del backend
      const timeRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api'}/time`);
      const { now } = await timeRes.json();
      const today = new Date(now);
      let dateToUse = today;
      if (dateOverride) {
        // Si el usuario elige una fecha, usarla (pero nunca mayor a hoy)
        const chosen = new Date(dateOverride);
        if (chosen > today) {
          dateToUse = today;
        } else {
          dateToUse = chosen;
        }
      }
      setSelectedDate(format(dateToUse, 'yyyy-MM-dd'));
      // Pedir cotizaciones para la fecha seleccionada
      const rates = await exchangeService.getExchangeRates(dateToUse);
      setCards(rates);
      setDate(rates.length > 0 ? rates[0].date : format(dateToUse, 'yyyy-MM-dd'));
      setError(null);
      // Si después de las 10am no hay cotizaciones, mostrar mensaje especial
      const hour = today.getHours();
      if (rates.length === 0 && dateToUse.getTime() === today.getTime() && hour >= 10 && hour < 18) {
        setError('Aún no hay cotizaciones publicadas para hoy. El mercado abre a las 10am. Si es después de las 12pm y no ves datos, probá seleccionar el día anterior.');
      }
      if (rates.length === 0 && dateToUse.getTime() !== today.getTime()) {
        setError('No hay cotizaciones para la fecha seleccionada.');
      }
    } catch (err) {
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
  const filteredCards = cards.filter(card =>
    card.code.toLowerCase().includes(search.toLowerCase()) ||
    card.name.toLowerCase().includes(search.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const paginatedCards = filteredCards.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
        </div>
        {/* Fecha de cotización y búsqueda */}
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {t('date')}: <span className="font-semibold text-gray-900 dark:text-white">{date}</span>
            <input
              type="date"
              className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={selectedDate}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={handleDateChange}
            />
          </div>
          <input
            type="text"
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            placeholder={t('search')}
            value={search}
            onChange={handleSearch}
          />
        </div>
        {/* Cards de monedas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {paginatedCards.map((currency) => (
            <CurrencyCard key={currency.code} currency={currency} />
          ))}
        </div>
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
    </div>
  );
};

export default Dashboard;