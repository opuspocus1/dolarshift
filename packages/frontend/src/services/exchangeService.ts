import axios from 'axios';
import { format, subDays } from 'date-fns';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api';
export const BCRA_API_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

// Lista de monedas que típicamente se cotizan como currency/USD
const USD_QUOTED_CURRENCIES = ['EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'NZD'];

export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRate {
  code: string;
  name: string;
  date: string;
  buy: number;
  sell: number;
  codigomoneda?: string;
  descripcion?: string;
  tipopase?: number;
  tipocotizacion?: number;
  isUsdQuoted?: boolean;
  rateAgainstUSD?: number;
  rateAgainstARS?: number;
  usdFormat?: string;
  arsFormat?: string;
}

export interface ExchangeRateHistory {
  date: string;
  buy: number;
  sell: number;
}

function processExchangeRates(rates: any[]): ExchangeRate[] {
  // Encontrar la tasa USD
  const usdRate = rates.find(rate => rate.codigoMoneda === 'USD');
  if (!usdRate) {
    console.warn('USD rate not found, cannot process relative rates');
    return rates.map(rate => ({
      code: rate.codigoMoneda,
      name: rate.descripcion,
      date: rate.fecha,
      buy: rate.tipoCotizacion,
      sell: rate.tipoCotizacion,
      codigomoneda: rate.codigoMoneda,
      descripcion: rate.descripcion,
      tipopase: rate.tipoPase,
      tipocotizacion: rate.tipoCotizacion,
      rateAgainstARS: rate.tipoCotizacion,
      arsFormat: `${rate.codigoMoneda}/ARS`,
      rateAgainstUSD: undefined,
      usdFormat: undefined,
      isUsdQuoted: false
    }));
  }

  return rates.map(rate => {
    const isUsdQuoted = USD_QUOTED_CURRENCIES.includes(rate.codigoMoneda);
    let rateAgainstUSD: number | undefined = undefined;
    let rateAgainstARS: number | undefined = undefined;
    let usdFormat: string | undefined = undefined;
    let arsFormat: string | undefined = undefined;

    // Custom logic for ARS, USD, XAU, XAG
    if (rate.codigoMoneda === 'ARS') {
      // ARS
      rateAgainstUSD = rate.tipoPase ? 1 / rate.tipoPase : undefined;
      rateAgainstARS = 1;
      usdFormat = 'ARS/USD';
      arsFormat = 'ARS/ARS';
    } else if (rate.codigoMoneda === 'USD') {
      // USD
      rateAgainstUSD = 1;
      rateAgainstARS = rate.tipoCotizacion;
      usdFormat = 'USD/USD';
      arsFormat = 'USD/ARS';
    } else if (rate.codigoMoneda === 'XAU' || rate.codigoMoneda === 'XAG') {
      // XAU, XAG
      rateAgainstUSD = rate.tipoPase !== undefined ? rate.tipoPase : undefined;
      rateAgainstARS = undefined;
      usdFormat = `${rate.codigoMoneda}/USD`;
      arsFormat = undefined;
    } else {
      // Default/standard logic for all other currencies
      const newRate = usdRate.tipoCotizacion / rate.tipoCotizacion;
      rateAgainstUSD = isUsdQuoted ? 1 / newRate : newRate;
      rateAgainstARS = rate.tipoCotizacion;
      usdFormat = isUsdQuoted ? `${rate.codigoMoneda}/USD` : `USD/${rate.codigoMoneda}`;
      arsFormat = `${rate.codigoMoneda}/ARS`;
    }

    return {
      code: rate.codigoMoneda,
      name: rate.descripcion,
      date: rate.fecha,
      buy: rate.tipoCotizacion,
      sell: rate.tipoCotizacion,
      codigomoneda: rate.codigoMoneda,
      descripcion: rate.descripcion,
      tipopase: rate.tipoPase,
      tipocotizacion: rate.tipoCotizacion,
      isUsdQuoted,
      rateAgainstUSD,
      rateAgainstARS,
      usdFormat,
      arsFormat
    };
  });
}

export const exchangeService = {
  async getCurrencies(): Promise<Currency[]> {
    try {
      const response = await axios.get(`${BCRA_API_URL}/Cotizaciones`);
      return (response.data.results.detalle || []).map((divisa: any) => ({
        code: divisa.codigoMoneda,
        name: divisa.descripcion
      }));
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  },

  async getExchangeRates(date: Date): Promise<ExchangeRate[]> {
    try {
      const response = await axios.get(`${BCRA_API_URL}/Cotizaciones`);
      console.log('[exchangeService] Respuesta BCRA:', response.data);

      const bcraDate = response.data.results.fecha;
      console.log('[exchangeService] Fecha BCRA:', bcraDate);

      const rates = (response.data.results.detalle || [])
        .filter((rate: any) => rate && rate.codigoMoneda)
        .map((rate: any) => ({
          ...rate,
          fecha: bcraDate
        }));

      return processExchangeRates(rates);
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
  },

  // Nuevas funciones para Charts
  async getAvailableCurrencies(): Promise<Currency[]> {
    try {
      const response = await axios.get(`${BCRA_API_URL}/Cotizaciones`);
      return (response.data.results.detalle || []).map((item: any) => ({
        code: item.codigoMoneda,
        name: item.descripcion
      }));
    } catch (error) {
      console.error('Error fetching available currencies:', error);
      throw error;
    }
  },

  async getChartHistory(currencyCode: string, startDate: string, endDate: string): Promise<ExchangeRateHistory[]> {
    try {
      // Formatear las fechas para la API del BCRA
      const formattedStartDate = format(new Date(startDate), 'yyyy-MM-dd');
      const formattedEndDate = format(new Date(endDate), 'yyyy-MM-dd');
      
      const response = await axios.get(
        `${BCRA_API_URL}/Cotizaciones/${currencyCode}?fechadesde=${formattedStartDate}&fechahasta=${formattedEndDate}`
      );
      
      // La respuesta tiene una estructura anidada: results[].detalle[]
      const history: ExchangeRateHistory[] = [];
      response.data.results.forEach((day: any) => {
        const detail = day.detalle[0]; // Tomamos el primer detalle de cada día
        if (detail) {
          history.push({
            date: day.fecha,
            buy: detail.tipoCotizacion,
            sell: detail.tipoCotizacion
          });
        }
      });

      return history;
    } catch (error) {
      console.error('Error fetching chart history:', error);
      throw error;
    }
  }
}; 