import axios from 'axios';
import { format, subDays } from 'date-fns';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api';

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
}

export interface ExchangeRateHistory {
  date: string;
  buy: number;
  sell: number;
}

export const exchangeService = {
  async getCurrencies(): Promise<Currency[]> {
    const response = await axios.get(`${API_BASE_URL}/exchange/currencies`);
    return response.data;
  },

  async getExchangeRates(date: Date): Promise<ExchangeRate[]> {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const response = await axios.get(`${API_BASE_URL}/exchange/rates/${formattedDate}`);

    // Get previous day's rates for calculating changes
    const previousDate = subDays(date, 1);
    const previousFormattedDate = format(previousDate, 'yyyy-MM-dd');
    let previousRatesObj: Record<string, any> = {};

    try {
      const previousResponse = await axios.get(`${API_BASE_URL}/exchange/rates/${previousFormattedDate}`);
      previousRatesObj = previousResponse.data.rates as Record<string, any>;
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        previousRatesObj = {};
      } else {
        throw err;
      }
    }

    const currentRatesObj = response.data.rates as Record<string, any>;

    const currentRates = Object.entries(currentRatesObj).map(([code, value]) => ({
      code,
      name: value.name,
      buy: typeof value.buy === 'number' ? value.buy : null,
      sell: typeof value.sell === 'number' ? value.sell : null,
      date: response.data.date
    }));
    const previousRates = Object.entries(previousRatesObj).map(([code, value]) => ({
      code,
      ...(typeof value === 'object' && value !== null ? value : {})
    }));

    return currentRates.map((rate: ExchangeRate) => {
      const previousRate = previousRates.find((pr: ExchangeRate) => pr.code === rate.code);
      const buyChange = previousRate ? rate.buy - previousRate.buy : 0;
      const sellChange = previousRate ? rate.sell - previousRate.sell : 0;
      const buyChangePercent = previousRate ? (buyChange / previousRate.buy) * 100 : 0;
      const sellChangePercent = previousRate ? (sellChange / previousRate.sell) * 100 : 0;

      return {
        ...rate,
        change: (buyChange + sellChange) / 2,
        changePercent: (buyChangePercent + sellChangePercent) / 2
      };
    });
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date): Promise<ExchangeRateHistory[]> {
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    const response = await axios.get(
      `${API_BASE_URL}/exchange/rates/${currency}/${formattedStartDate}/${formattedEndDate}`
    );
    return response.data;
  }
}; 