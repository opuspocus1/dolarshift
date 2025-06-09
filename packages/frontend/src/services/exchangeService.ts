import axios from 'axios';
import { format, subDays } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  code: string;
  name: string;
  rate: number;
  change: number;
  changePercent: number;
}

export const exchangeService = {
  async getCurrencies(): Promise<Currency[]> {
    const response = await axios.get(`${API_BASE_URL}/exchange/currencies`);
    return response.data.results.map((currency: any) => ({
      code: currency.codigo,
      name: currency.denominacion
    }));
  },

  async getExchangeRates(date: Date): Promise<ExchangeRate[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const response = await axios.get(`${API_BASE_URL}/exchange/rates/${formattedDate}`);
    
    // Get previous day's rates for calculating changes
    const previousDate = subDays(date, 1);
    const previousFormattedDate = format(previousDate, 'yyyy-MM-dd');
    const previousResponse = await axios.get(`${API_BASE_URL}/exchange/rates/${previousFormattedDate}`);

    const currentRates = response.data.results.detalle;
    const previousRates = previousResponse.data.results.detalle;

    return currentRates.map((rate: any) => {
      const previousRate = previousRates.find((pr: any) => pr.codigoMoneda === rate.codigoMoneda);
      const change = previousRate ? rate.tipoCotizacion - previousRate.tipoCotizacion : 0;
      const changePercent = previousRate ? (change / previousRate.tipoCotizacion) * 100 : 0;

      return {
        code: rate.codigoMoneda,
        name: rate.descripcion,
        rate: rate.tipoCotizacion,
        change,
        changePercent
      };
    });
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date) {
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    const response = await axios.get(
      `${API_BASE_URL}/exchange/rates/${currency}/${formattedStartDate}/${formattedEndDate}`
    );
    return response.data.results.map((result: any) => ({
      date: result.fecha,
      rate: result.detalle[0]?.tipoCotizacion || 0
    }));
  }
}; 