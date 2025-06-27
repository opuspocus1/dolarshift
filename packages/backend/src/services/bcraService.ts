import axios from 'axios';
import https from 'https';
import { format, subDays } from 'date-fns';

const BCRA_API_BASE_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

const agent = new https.Agent({ rejectUnauthorized: false });

interface BCRAExchangeRate {
  codigoMoneda: string;
  descripcion: string;
  tipoPase: number;
  tipoCotizacion: number;
}

interface BCRAExchangeRateResponse {
  status: number;
  results: {
    fecha: string;
    detalle: BCRAExchangeRate[];
  };
}

interface ProcessedExchangeRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  date: string;
  isUsdQuoted?: boolean; // Indicates if the rate is currency/USD instead of USD/currency
}

interface BCRAHistoryResponse {
  results: Array<{
    fecha: string;
    detalle: BCRAExchangeRate[];
  }>;
}

interface CurrencyResponse {
  results: Array<{
    codigo: string;
    denominacion: string;
  }>;
}

function processRatesRelativeToUSD(rates: ProcessedExchangeRate[]): ProcessedExchangeRate[] {
  // Find USD rate
  const usdRate = rates.find(rate => rate.code === 'USD');
  if (!usdRate) {
    console.warn('USD rate not found, cannot process relative rates');
    return rates;
  }

  // List of currencies that are typically quoted as currency/USD
  const usdQuotedCurrencies = ['EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'NZD'];

  return rates
    .filter(rate => rate.code !== 'ARS') // Remove ARS/ARS rate
    .map(rate => {
      if (rate.code === 'USD') {
        return rate;
      }

      // Calculate new rate relative to USD
      const newBuy = usdRate.buy / rate.buy;
      const newSell = usdRate.sell / rate.sell;

      // Check if this currency is typically quoted as currency/USD
      const isUsdQuoted = usdQuotedCurrencies.includes(rate.code);

      return {
        ...rate,
        buy: isUsdQuoted ? 1 / newBuy : newBuy,
        sell: isUsdQuoted ? 1 / newSell : newSell,
        isUsdQuoted
      };
    });
}

export const bcraService = {
  async getExchangeRates(date: Date): Promise<ProcessedExchangeRate[]> {
    // Asegurarnos de que la fecha sea válida y no sea futura
    const today = new Date();
    const targetDate = date > today ? today : date;
    
    // Validación adicional: si la fecha es más de 1 día en el futuro, usar hoy
    const oneDayFromNow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const finalDate = targetDate > oneDayFromNow ? today : targetDate;
    
    console.log(`[BCRA Service] Using date: ${finalDate.toISOString()} (original: ${date.toISOString()})`);
    
    const formattedDate = format(finalDate, "yyyy-MM-dd'T'HH:mm:ss");
    const response = await axios.get<BCRAExchangeRateResponse>(`${BCRA_API_BASE_URL}/Cotizaciones`, {
      params: { fecha: formattedDate },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      },
      httpsAgent: agent
    });

    // Procesar los datos para separar compra y venta
    const rates = response.data.results.detalle;
    const processedRates = rates.map((rate: BCRAExchangeRate) => ({
      code: rate.codigoMoneda,
      name: rate.descripcion,
      buy: rate.tipoCotizacion,
      sell: rate.tipoCotizacion,
      date: response.data.results.fecha
    }));

    // Process rates relative to USD
    return processRatesRelativeToUSD(processedRates);
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date) {
    // Asegurarnos de que las fechas sean válidas y no sean futuras
    const today = new Date();
    const validStartDate = startDate > today ? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) : startDate;
    const validEndDate = endDate > today ? today : endDate;
    
    console.log(`[BCRA Service] Historical query for ${currency}: ${validStartDate.toISOString()} to ${validEndDate.toISOString()}`);
    
    const formattedStartDate = format(validStartDate, "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEndDate = format(validEndDate, "yyyy-MM-dd'T'HH:mm:ss");
    
    const response = await axios.get<BCRAHistoryResponse>(`${BCRA_API_BASE_URL}/Cotizaciones/${currency}`, {
      params: {
        fechaDesde: formattedStartDate,
        fechaHasta: formattedEndDate
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      },
      httpsAgent: agent
    });

    console.log('[BCRA Service] getExchangeRateHistory raw response:', JSON.stringify(response.data.results.slice(0, 5)) + (response.data.results.length > 5 ? ' ...' : ''));

    // Procesar el historial para incluir compra y venta
    const mapped = response.data.results.map((result: { fecha: string; detalle: BCRAExchangeRate[] }) => {
      const buyRate = result.detalle.find((rate: BCRAExchangeRate) => rate.tipoPase === 1);
      const sellRate = result.detalle.find((rate: BCRAExchangeRate) => rate.tipoPase === 2);

      if (!buyRate && !sellRate) {
        return {
          date: result.fecha,
          buy: null,
          sell: null
        };
      }

      return {
        date: result.fecha,
        buy: buyRate?.tipoCotizacion ?? null,
        sell: sellRate?.tipoCotizacion ?? null
      };
    });

    console.log('[BCRA Service] getExchangeRateHistory mapped:', JSON.stringify(mapped.slice(0, 5)) + (mapped.length > 5 ? ' ...' : ''));
    return mapped;
  },

  async getCurrencies() {
    const response = await axios.get<CurrencyResponse>(`${BCRA_API_BASE_URL}/Maestros/Divisas`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      },
      httpsAgent: agent
    });
    return response.data.results.map((currency) => ({
      code: currency.codigo,
      name: currency.denominacion
    }));
  }
}; 