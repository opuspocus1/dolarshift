import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      title: 'Dashboard de Divisas',
      subtitle: 'Tasas de cambio actualizadas expresadas en relación al dólar estadounidense (USD)',
      search: 'Buscar divisa...',
      date: 'Fecha de cotización',
      prev: 'Anterior',
      next: 'Siguiente',
      loading: 'Cargando datos...',
      // Charts
      charts: {
        title: 'Gráficos de Tasas de Cambio',
        subtitle: 'Gráficos interactivos mostrando tendencias y movimientos de divisas',
        infoTitle: 'Información del Gráfico',
        howToReadTitle: 'Cómo Leer los Gráficos',
        howToRead1: 'Pase el mouse sobre cualquier punto para ver valores exactos',
        howToRead2: 'Tendencias verdes indican apreciación',
        howToRead3: 'Tendencias rojas indican depreciación',
        howToRead4: 'Los datos representan tasas de cierre para cada día',
        pairsTitle: 'Pares de Divisas Explicados',
        pair: {
          USD: 'USD/ARS',
          EUR: 'EUR/USD',
          GBP: 'GBP/USD',
          BTC: 'BTC/USD'
        },
        pairDesc: {
          USDARS: 'Dólar estadounidense a Peso argentino',
          EURUSD: 'Euro a Dólar estadounidense',
          GBPUSD: 'Libra esterlina a Dólar estadounidense',
          BTCUSD: 'Bitcoin a Dólar estadounidense'
        }
      },
      // Converter
      converter: {
        title: 'Dashboard de Divisas',
        subtitle: 'Tasas de cambio actualizadas expresadas en relación al dólar estadounidense (USD)',
        quickConvert: 'Conversión Rápida',
        topMovers: 'Mayores Movimientos'
      }
    }
  },
  en: {
    translation: {
      title: 'Currency Dashboard',
      subtitle: 'Updated exchange rates expressed relative to the US dollar (USD)',
      search: 'Search currency...',
      date: 'Exchange rate date',
      prev: 'Previous',
      next: 'Next',
      loading: 'Loading data...',
      // Charts
      charts: {
        title: 'Exchange Rate Charts',
        subtitle: 'Interactive charts showing currency trends and movements',
        infoTitle: 'Chart Information',
        howToReadTitle: 'How to Read the Charts',
        howToRead1: 'Hover over any point to see exact values',
        howToRead2: 'Green trends indicate appreciation',
        howToRead3: 'Red trends indicate depreciation',
        howToRead4: 'Data represents closing rates for each day',
        pairsTitle: 'Currency Pairs Explained',
        pair: {
          USD: 'USD/ARS',
          EUR: 'EUR/USD',
          GBP: 'GBP/USD',
          BTC: 'BTC/USD'
        },
        pairDesc: {
          USDARS: 'US Dollar to Argentine Peso',
          EURUSD: 'Euro to US Dollar',
          GBPUSD: 'British Pound to US Dollar',
          BTCUSD: 'Bitcoin to US Dollar'
        }
      },
      // Converter
      converter: {
        title: 'Currency Dashboard',
        subtitle: 'Updated exchange rates expressed relative to the US dollar (USD)',
        quickConvert: 'Quick Conversion',
        topMovers: 'Top Movers'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 