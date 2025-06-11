import axios from 'axios';
import { format, subDays } from 'date-fns';
import { CurrencyRate, Currency } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api';
export const BCRA_API_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

export interface ExchangeRate {
  code: string;
  name: string;
  value: number;
  date: string;
}

export interface ExchangeRateHistory {
  date: string;
  value: number;
}

export const exchangeService = {
  async getExchangeRates(): Promise<ExchangeRate[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticascambiarias/v1.0/Cotizaciones/USD`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      return data.detalle.map((item: any) => ({
        code: item.codMoneda,
        name: item.nomMoneda,
        value: item.valor,
        date: item.fecha
      }));
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  },

  async getAvailableCurrencies(): Promise<Currency[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticascambiarias/v1.0/Cotizaciones/USD`);
      if (!response.ok) {
        throw new Error('Failed to fetch available currencies');
      }
      const data = await response.json();
      return data.detalle.map((item: any) => ({
        code: item.codMoneda,
        name: item.nomMoneda
      }));
    } catch (error) {
      console.error('Error fetching available currencies:', error);
      throw error;
    }
  },

  async getExchangeRateHistory(currencyCode: string, startDate: string, endDate: string): Promise<ExchangeRateHistory[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/estadisticascambiarias/v1.0/Cotizaciones/${currencyCode}?fecha=${startDate}T00:00:00`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate history for ${currencyCode}`);
      }
      const data = await response.json();
      return data.detalle.map((item: any) => ({
        date: item.fecha,
        value: item.valor
      }));
    } catch (error) {
      console.error('Error fetching exchange rate history:', error);
      throw error;
    }
  }
}; 