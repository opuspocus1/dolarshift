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

export const bcraService = {
  async getExchangeRates(date: Date): Promise<ProcessedExchangeRate[]> {
    // Asegurarnos de que la fecha sea válida
    const today = new Date();
    const targetDate = date > today ? today : date;
    
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
    const processedRates: ProcessedExchangeRate[] = [];

    // Agrupar por moneda
    const ratesByCurrency = rates.reduce((acc: { [key: string]: BCRAExchangeRate[] }, rate: BCRAExchangeRate) => {
      if (!acc[rate.codigoMoneda]) {
        acc[rate.codigoMoneda] = [];
      }
      acc[rate.codigoMoneda].push(rate);
      return acc;
    }, {});

    // Procesar cada moneda
    Object.entries(ratesByCurrency).forEach(([code, currencyRates]) => {
      const buyRate = currencyRates.find(rate => rate.tipoPase === 1);
      const sellRate = currencyRates.find(rate => rate.tipoPase === 2);

      if (buyRate || sellRate) {
        processedRates.push({
          code,
          name: buyRate?.descripcion || sellRate?.descripcion || code,
          buy: buyRate?.tipoCotizacion || 0,
          sell: sellRate?.tipoCotizacion || 0,
          date: response.data.results.fecha
        });
      }
    });

    return processedRates;
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date) {
    const formattedStartDate = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEndDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");
    
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

    // Procesar el historial para incluir compra y venta
    return response.data.results.map((result) => {
      const buyRate = result.detalle.find((rate: BCRAExchangeRate) => rate.tipoPase === 1);
      const sellRate = result.detalle.find((rate: BCRAExchangeRate) => rate.tipoPase === 2);

      return {
        date: result.fecha,
        buy: buyRate?.tipoCotizacion || 0,
        sell: sellRate?.tipoCotizacion || 0
      };
    });
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