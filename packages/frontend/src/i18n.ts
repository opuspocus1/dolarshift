import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      title: 'Panel de Monedas',
      subtitle: 'Cotizaciones del día de todas las monedas respecto al peso argentino',
      search: 'Buscar moneda...',
      date: 'Cotización del día',
      prev: 'Anterior',
      next: 'Siguiente',
      loading: 'Cargando datos...',
      // Charts
      charts: {
        title: 'Gráficos de Cotización',
        subtitle: 'Gráficos interactivos mostrando tendencias y movimientos de monedas',
        infoTitle: 'Información sobre los gráficos',
        howToReadTitle: 'Cómo leer los gráficos',
        howToRead1: 'Pasá el mouse sobre un punto para ver el valor exacto',
        howToRead2: 'Las tendencias verdes indican apreciación',
        howToRead3: 'Las tendencias rojas indican depreciación',
        howToRead4: 'Los datos representan el cierre de cada día',
        pairsTitle: 'Explicación de pares de monedas',
        pair: {
          USD: 'Dólar/ARS',
          EUR: 'Euro/ARS',
          GBP: 'Libra/ARS',
          BTC: 'Bitcoin/ARS'
        },
        pairDesc: {
          USDARS: 'Dólar estadounidense a peso argentino',
          EURUSD: 'Euro a dólar estadounidense',
          GBPUSD: 'Libra esterlina a dólar estadounidense',
          BTCUSD: 'Bitcoin a dólar estadounidense'
        }
      },
      // Converter
      converter: {
        title: 'Conversor de Monedas',
        subtitle: 'Convertí entre diferentes monedas con cotizaciones en tiempo real',
        quickConvert: 'Conversión rápida',
        topMovers: 'Mayores variaciones'
      }
    }
  },
  en: {
    translation: {
      title: 'Currency Dashboard',
      subtitle: 'Today\'s exchange rates for all currencies against the Argentine peso',
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
          EUR: 'EUR/ARS',
          GBP: 'GBP/ARS',
          BTC: 'BTC/ARS'
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
        subtitle: 'Today\'s exchange rates for all currencies against the Argentine peso',
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