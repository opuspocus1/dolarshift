import axios from 'axios';
import { format, subDays } from 'date-fns';

const BCRA_API_BASE_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

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

export const bcraService = {
  async getExchangeRates(date: Date): Promise<BCRAExchangeRateResponse> {
    const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm:ss");
    const response = await axios.get(`${BCRA_API_BASE_URL}/Cotizaciones`, {
      params: { fecha: formattedDate },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      }
    });
    return response.data;
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date) {
    const formattedStartDate = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEndDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");
    
    const response = await axios.get(`${BCRA_API_BASE_URL}/Cotizaciones/${currency}`, {
      params: {
        fechaDesde: formattedStartDate,
        fechaHasta: formattedEndDate
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      }
    });
    return response.data;
  },

  async getCurrencies() {
    const response = await axios.get(`${BCRA_API_BASE_URL}/Maestros/Divisas`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      }
    });
    return response.data;
  }
}; 