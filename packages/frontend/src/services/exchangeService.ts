import axios from 'axios';
import { format, subDays, isToday, startOfDay } from 'date-fns';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api';
export const BCRA_API_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

// Lista de monedas que típicamente se cotizan como currency/USD
export const USD_QUOTED_CURRENCIES = ['EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'NZD'];

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
  tipopase?: number;
}

// Tipos de dólar a mostrar en el ticker
export const DOLLAR_TICKER_TYPES = [
  { casa: 'oficial', nombre: 'Dólar Oficial' },
  { casa: 'blue', nombre: 'Dólar Blue' },
  { casa: 'bolsa', nombre: 'Dólar Bolsa' },
  { casa: 'contadoconliqui', nombre: 'Dólar CCL' },
  { casa: 'tarjeta', nombre: 'Dólar Tarjeta' },
  { casa: 'mayorista', nombre: 'Dólar Mayorista' },
  { casa: 'cripto', nombre: 'Dólar Cripto' },
];

export interface DollarTickerData {
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  variacionCompra: number | null; // % respecto a ayer
  variacionVenta: number | null;  // % respecto a ayer
  fechaActualizacion: string;
}

// Cache del frontend usando localStorage
class FrontendCache {
  private static instance: FrontendCache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  static getInstance(): FrontendCache {
    if (!FrontendCache.instance) {
      FrontendCache.instance = new FrontendCache();
    }
    return FrontendCache.instance;
  }

  private getCacheKey(type: string, ...params: string[]): string {
    const today = format(new Date(), 'yyyy-MM-dd');
    return `${type}_${today}_${params.join('_')}`;
  }

  set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // También guardar en localStorage para persistencia
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl
      }));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (cached) {
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }

    // Intentar recuperar de localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          // Restaurar en memoria
          this.cache.set(key, parsed);
          return parsed.data;
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Could not read from localStorage:', error);
    }

    return null;
  }

  clear(): void {
    this.cache.clear();
    // Limpiar localStorage también
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('currencies_') || key.startsWith('rates_') || key.startsWith('history_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }
  }

  getStats(): { hits: number; misses: number; keys: number } {
    return {
      hits: 0, // Implementar contadores si es necesario
      misses: 0,
      keys: this.cache.size
    };
  }
}

const frontendCache = FrontendCache.getInstance();

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
      rateAgainstUSD = rate.tipoPase ? rate.tipoPase : undefined;
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
  async getLatestExchangeRates(): Promise<ExchangeRate[]> {
    try {
      console.log('[Frontend Cache] Fetching latest rates from API (no cache)');
      
      // Siempre hacer fetch al endpoint latest para obtener el último dato oficial
      const response = await axios.get(`${API_BASE_URL}/exchange/rates/latest`);
      const data = response.data;
      
      console.log(`[Frontend Cache] Latest rates fetched from API, records: ${Array.isArray(data) ? data.length : 0}`);
      return data;
    } catch (error) {
      console.error('Error fetching latest exchange rates:', error);
      return [];
    }
  },

  async getCurrencies(): Promise<Currency[]> {
    try {
      const cacheKey = `currencies_${format(new Date(), 'yyyy-MM-dd')}`;
      const cachedData = frontendCache.get(cacheKey);
      
      if (cachedData) {
        console.log('[Frontend Cache] Currencies served from cache');
        return cachedData;
      }

      console.log('[Frontend Cache] Fetching currencies from API');
      const response = await axios.get(`${API_BASE_URL}/exchange/currencies`);
      const data = response.data;
      
      // Cache por 24 horas
      frontendCache.set(cacheKey, data, 24 * 60 * 60 * 1000);
      
      return data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  },

  async getExchangeRates(date: Date): Promise<ExchangeRate[]> {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const cacheKey = `rates_${formattedDate}`;
      const cachedData = frontendCache.get(cacheKey);
      
      if (cachedData) {
        console.log(`[Frontend Cache] Rates for ${formattedDate} served from cache`);
        return cachedData;
      }

      console.log(`[Frontend Cache] Fetching rates for ${formattedDate} from API`);
      const response = await axios.get(`${API_BASE_URL}/exchange/rates/${formattedDate}`);
      const data = response.data;
      
      // Cache por 1 hora para datos actuales, 24 horas para históricos
      const ttl = isToday(date) ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      frontendCache.set(cacheKey, data, ttl);
      
      return data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return [];
    }
  },

  async getExchangeRateHistory(currency: string, startDate: Date, endDate: Date): Promise<ExchangeRateHistory[]> {
    console.log('[exchangeService] getExchangeRateHistory', currency, startDate, endDate);
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    const cacheKey = `history_${currency}_${formattedStartDate}_${formattedEndDate}`;
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      console.log(`[Frontend Cache] History for ${currency} (${formattedStartDate} to ${formattedEndDate}) served from cache`);
      return cachedData;
    }
    console.log(`[Frontend Cache] Fetching history for ${currency} from API (${formattedStartDate} to ${formattedEndDate})`);
    const response = await axios.get(`${API_BASE_URL}/exchange/rates/${currency}/${formattedStartDate}/${formattedEndDate}`);
    const data = response.data;
    console.log('[exchangeService] getExchangeRateHistory response', data?.length);
    // Cache por 24 horas para datos históricos
    frontendCache.set(cacheKey, data, 24 * 60 * 60 * 1000);
    return data;
  },

  // Nuevas funciones para Charts
  async getAvailableCurrencies(): Promise<Currency[]> {
    return this.getCurrencies();
  },

  async getChartHistory(currency: string, startDate: string, endDate: string): Promise<ExchangeRateHistory[]> {
    console.log('[exchangeService] getChartHistory', currency, startDate, endDate);
    
    // Intentar usar el bulk anual cacheado si el rango pedido está dentro del bulk
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const bulkStart = new Date(today);
    bulkStart.setDate(bulkStart.getDate() - 370); // Bulk cubre ~370 días
    const bulkStartStr = format(bulkStart, 'yyyy-MM-dd');
    const bulkEnd = new Date(today);
    bulkEnd.setDate(bulkEnd.getDate() - 1); // Bulk hasta ayer
    const bulkEndStr = format(bulkEnd, 'yyyy-MM-dd');

    // Caso 1: Todo el rango está en el bulk
    if (startDate >= bulkStartStr && endDate <= bulkEndStr) {
      const bulk = await this.getBulkChartHistory(bulkStartStr, bulkEndStr);
      const history = bulk[currency] || [];
      // Filtrar solo el rango pedido
      return history.filter(h => h.date >= startDate && h.date <= endDate);
    }

    // Caso 2: El rango termina en hoy (o después de bulkEnd) y empieza dentro del bulk
    if (startDate >= bulkStartStr && endDate >= bulkEndStr && startDate <= bulkEndStr && endDate <= todayStr) {
      // 1. Obtener del bulk hasta bulkEnd
      const bulk = await this.getBulkChartHistory(bulkStartStr, bulkEndStr);
      const historyBulk = (bulk[currency] || []).filter(h => h.date >= startDate && h.date <= bulkEndStr);
      // 2. Obtener el dato de latest para endDate (si existe)
      let latestDay: ExchangeRateHistory[] = [];
      if (endDate === todayStr) {
        // Buscar en cache de latest
        const cacheKey = `rates_${todayStr}`;
        const latestRates = frontendCache.get(cacheKey);
        if (latestRates && Array.isArray(latestRates)) {
          const found = latestRates.find((r: any) => r.code === currency || r.codigomoneda === currency);
          if (found) {
            latestDay = [{
              date: todayStr,
              buy: found.buy,
              sell: found.sell,
              tipopase: found.tipopase
            }];
          }
        }
      }
      // Unir ambos resultados
      return [...historyBulk, ...latestDay];
    }

    // Usar cache del frontend para el rango puntual
    const cacheKey = `chart_history_${currency}_${startDate}_${endDate}`;
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      console.log(`[Frontend Cache] Chart history for ${currency} (${startDate} to ${endDate}) served from cache`);
      return cachedData;
    }
    
    console.log(`[Frontend Cache] Fetching chart history for ${currency} from API (${startDate} to ${endDate})`);
    const res = await axios.get(`${API_BASE_URL}/exchange/rates/${currency}/${startDate}/${endDate}`);
    console.log('[exchangeService] getChartHistory response', res.data?.length);
    
    // Cache por 24 horas para datos históricos
    frontendCache.set(cacheKey, res.data, 24 * 60 * 60 * 1000);
    
    return res.data;
  },

  // Nuevo método optimizado para obtener historial de todas las monedas principales de una vez
  async getBulkChartHistory(startDate: string, endDate: string): Promise<{ [currency: string]: ExchangeRateHistory[] }> {
    // console.log('[exchangeService] getBulkChartHistory', startDate, endDate);
    // Usar cache del frontend
    const cacheKey = `bulk_chart_history_${startDate}_${endDate}`;
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
      // console.log(`[Frontend Cache] Bulk chart history (${startDate} to ${endDate}) served from cache`);
      // console.log('[getBulkChartHistory] bulkData (from cache):', cachedData);
      return cachedData;
    }
    // console.log(`[Frontend Cache] Fetching bulk chart history from API (${startDate} to ${endDate})`);
    
    try {
      const res = await axios.get(`${API_BASE_URL}/exchange/rates/history/bulk/${startDate}/${endDate}`);
      // Soportar nuevo formato: { data, rangoRealDevuelto }
      const bulkData = res.data?.data || res.data;
      // console.log('[exchangeService] getBulkChartHistory response', Object.keys(bulkData || {}).length, 'currencies');
      // console.log('[getBulkChartHistory] bulkData (from API):', bulkData);
      // Cache por 24 horas para datos históricos
      frontendCache.set(cacheKey, bulkData, 24 * 60 * 60 * 1000);
      return bulkData;
    } catch (error: any) {
      console.error('Error fetching bulk history:', error);
      
      // Si es un error 503 (Service Unavailable), intentar con un rango anterior
      if (error.response?.status === 503 || error.response?.status === 404) {
        console.log('[Frontend Cache] Bulk history failed, trying with earlier date range');
        
        // Intentar con un rango anterior (7 días antes)
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        const newStartDate = new Date(startDateObj);
        newStartDate.setDate(newStartDate.getDate() - 7);
        const newEndDate = new Date(endDateObj);
        newEndDate.setDate(newEndDate.getDate() - 7);
        
        const fallbackStartDate = newStartDate.toISOString().slice(0, 10);
        const fallbackEndDate = newEndDate.toISOString().slice(0, 10);
        
        try {
          const fallbackRes = await axios.get(`${API_BASE_URL}/exchange/rates/history/bulk/${fallbackStartDate}/${fallbackEndDate}`);
          const fallbackData = fallbackRes.data?.data || fallbackRes.data;
          
          if (fallbackData && Object.keys(fallbackData).length > 0) {
            console.log(`[Frontend Cache] Fallback bulk history successful for ${fallbackStartDate} to ${fallbackEndDate}`);
            // Cache por 24 horas para datos históricos
            frontendCache.set(cacheKey, fallbackData, 24 * 60 * 60 * 1000);
            return fallbackData;
          }
        } catch (fallbackError) {
          console.error('Fallback bulk history also failed:', fallbackError);
        }
      }
      
      // Si todo falla, devolver un objeto vacío
      console.warn('[Frontend Cache] All bulk history attempts failed, returning empty data');
      return {};
    }
  },

  // Funciones para manejar el cache
  clearCache(): void {
    frontendCache.clear();
    console.log('[Frontend Cache] Cache cleared');
  },

  getCacheStats(): { hits: number; misses: number; keys: number } {
    return frontendCache.getStats();
  },
};

export async function getDollarTickerData(): Promise<DollarTickerData[]> {
  // 1. Obtener valores actuales
  const todayRes = await axios.get('https://dolarapi.com/v1/dolares');
  const todayData = todayRes.data;

  // 2. Obtener valores de ayer (fecha de ayer)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yyyy = yesterday.getFullYear();
  const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
  const dd = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yyyy}-${mm}-${dd}`;
  const historicRes = await axios.get('https://api.argentinadatos.com/v1/cotizaciones/dolares');
  const historicData = historicRes.data.filter((item: any) => item.fecha === yesterdayStr);

  // 3. Mapear y calcular variaciones
  return DOLLAR_TICKER_TYPES.map(type => {
    const today = todayData.find((d: any) => d.casa === type.casa);
    const yesterday = historicData.find((d: any) => d.casa === type.casa);
    const variacionCompra = (today && yesterday && yesterday.compra)
      ? ((today.compra - yesterday.compra) / yesterday.compra) * 100
      : null;
    const variacionVenta = (today && yesterday && yesterday.venta)
      ? ((today.venta - yesterday.venta) / yesterday.venta) * 100
      : null;
    return {
      casa: type.casa,
      nombre: type.nombre,
      compra: today ? today.compra : null,
      venta: today ? today.venta : null,
      variacionCompra,
      variacionVenta,
      fechaActualizacion: today ? today.fechaActualizacion : '',
    };
  });
}

export default exchangeService; 