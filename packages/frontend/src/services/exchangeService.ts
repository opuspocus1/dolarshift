import axios from 'axios';
import { format, subDays } from 'date-fns';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api';
export const BCRA_API_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  code: string;
  name: string;
  buy: number;
  sell: number;
  date: string;
  change?: number;
  changePercent?: number;
  codigomoneda?: string;
  descripcion?: string;
  tipopase?: string;
  tipocotizacion?: number;
}

export interface ExchangeRateHistory {
  date: string;
  buy: number;
  sell: number;
}

export const exchangeService = {
  async getCurrencies(): Promise<Currency[]> {
    try {
      const response = await axios.get(`${BCRA_API_URL}/Maestros/Divisas`);
      return response.data.map((divisa: any) => ({
        code: divisa.codigo,
        name: divisa.descripcion
      }));
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  },

  async getExchangeRates(date: Date): Promise<ExchangeRate[]> {
    try {
      // Obtener la última cotización disponible
      const response = await axios.get(`${BCRA_API_URL}/Cotizaciones`);
      console.log('[exchangeService] Respuesta BCRA:', response.data);

      // Mapear la respuesta del BCRA al formato esperado
      const rates = Object.values(response.data.results).map((rate: any) => ({
        code: rate.codigo,
        name: rate.descripcion,
        codigomoneda: rate.codigo,
        descripcion: rate.descripcion,
        tipopase: rate.tipoPase,
        tipocotizacion: rate.tipoCotizacion,
        date: rate.fecha,
        buy: rate.tipoCotizacion, // Usamos tipoCotizacion como valor de compra
        sell: rate.tipoCotizacion  // Usamos tipoCotizacion como valor de venta
      }));

      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return [];
    }
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date): Promise<ExchangeRateHistory[]> {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      const response = await axios.get(
        `${BCRA_API_URL}/Cotizaciones/${currency}/${formattedStartDate}/${formattedEndDate}`
      );
      
      return response.data.map((rate: any) => ({
        date: rate.fecha,
        buy: rate.tipoCotizacion,
        sell: rate.tipoCotizacion
      }));
    } catch (error) {
      console.error('Error fetching exchange rate history:', error);
      return [];
    }
  }
}; 