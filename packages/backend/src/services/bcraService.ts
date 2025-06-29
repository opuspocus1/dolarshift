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
  // No hacer conversión, solo devolver los valores en ARS
  return rates;
}

export const bcraService = {
  async getLatestExchangeRates(): Promise<ProcessedExchangeRate[]> {
    console.log('[BCRA Service] Fetching latest rates from BCRA API (no date parameter)');
    
    // Siempre hacer fetch directo al endpoint sin fecha para obtener el último dato oficial
    const response = await axios.get<BCRAExchangeRateResponse>(`${BCRA_API_BASE_URL}/Cotizaciones`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      },
      httpsAgent: agent
    });
    
    console.log(`[BCRA Service] Latest rates fetched, date: ${response.data.results.fecha}`);
    
    // Procesar los datos para separar compra y venta
    const rates = response.data.results.detalle;
    const processedRates = rates.map((rate: BCRAExchangeRate) => {
      // Usar tipoCotizacion (en pesos) para todas las monedas
      let buy = rate.tipoCotizacion;
      let sell = rate.tipoCotizacion;
      
      // Para XAU y XAG, mantener el comportamiento especial si tipoCotizacion es 0
      if ((rate.codigoMoneda === 'XAU' || rate.codigoMoneda === 'XAG') && rate.tipoCotizacion === 0 && rate.tipoPase !== 0) {
        buy = rate.tipoPase;
        sell = rate.tipoPase;
      }
      
      return {
        code: rate.codigoMoneda,
        name: rate.descripcion,
        buy,
        sell,
        date: response.data.results.fecha
      };
    });
    
    // Process rates relative to USD
    return processRatesRelativeToUSD(processedRates);
  },

  async getExchangeRates(date: Date): Promise<ProcessedExchangeRate[]> {
    // Asegurarnos de que la fecha sea válida y no sea futura
    const today = new Date();
    let targetDate = date > today ? today : date;
    // Validación adicional: si la fecha es más de 1 día en el futuro, usar hoy
    const oneDayFromNow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    if (targetDate > oneDayFromNow) targetDate = today;

    // NUEVO: Si la fecha pedida es hoy o futura, consultar la última fecha real del BCRA
    let bcraDateStr = null;
    if (targetDate >= today) {
      const latest = await axios.get<BCRAExchangeRateResponse>(`${BCRA_API_BASE_URL}/Cotizaciones`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
        },
        httpsAgent: agent
      });
      bcraDateStr = latest.data.results.fecha;
      targetDate = new Date(bcraDateStr);
    }

    console.log(`[BCRA Service] Using date: ${targetDate.toISOString()} (original: ${date.toISOString()})`);
    const formattedDate = format(targetDate, "yyyy-MM-dd'T'HH:mm:ss");
    const response = await axios.get<BCRAExchangeRateResponse>(`${BCRA_API_BASE_URL}/Cotizaciones`, {
      params: { fecha: formattedDate },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      },
      httpsAgent: agent
    });
    // Procesar los datos para separar compra y venta
    const rates = response.data.results.detalle;
    const processedRates = rates.map((rate: BCRAExchangeRate) => {
      // Usar tipoCotizacion (en pesos) para todas las monedas
      let buy = rate.tipoCotizacion;
      let sell = rate.tipoCotizacion;
      
      // Para XAU y XAG, mantener el comportamiento especial si tipoCotizacion es 0
      if ((rate.codigoMoneda === 'XAU' || rate.codigoMoneda === 'XAG') && rate.tipoCotizacion === 0 && rate.tipoPase !== 0) {
        buy = rate.tipoPase;
        sell = rate.tipoPase;
      }
      
      return {
        code: rate.codigoMoneda,
        name: rate.descripcion,
        buy,
        sell,
        date: response.data.results.fecha
      };
    });
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
      const rate = result.detalle[0];
      if (!rate) {
        return {
          date: result.fecha,
          buy: null,
          sell: null
        };
      }
      // Usar tipoCotizacion (en pesos) para todas las monedas
      let buy = rate.tipoCotizacion;
      let sell = rate.tipoCotizacion;
      
      // Para XAU y XAG, usar tipoPase si tipoCotizacion es 0
      if ((rate.codigoMoneda === 'XAU' || rate.codigoMoneda === 'XAG') && rate.tipoCotizacion === 0 && rate.tipoPase !== 0) {
        buy = rate.tipoPase;
        sell = rate.tipoPase;
      }
      
      return {
        date: result.fecha,
        buy,
        sell
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