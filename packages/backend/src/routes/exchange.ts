import { Router, Request, Response } from 'express';
import { bcraService } from '../services/bcraService';
import { format, subDays, isToday, startOfDay } from 'date-fns';
import { AxiosError } from 'axios';
import { cacheConfig, getCacheKey, clearAllCaches, getAllCacheStats } from '../config/cache';
import { cacheWarmingService } from '../services/cacheWarmingService';

const router = Router();

// Get all available currencies
router.get('/currencies', async (req, res) => {
  try {
    const cacheKey = getCacheKey('currencies');
    const cachedData = cacheConfig.metadata.get(cacheKey);
    
    if (cachedData) {
      console.log('[Cache] Currencies served from metadata cache');
      return res.json(cachedData);
    }

    console.log('[Cache] Fetching currencies from BCRA API');
    const data = await bcraService.getCurrencies();
    cacheConfig.metadata.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching currencies:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching currencies', details: axiosError.response?.data || axiosError.message });
  }
});

// Get latest exchange rates (from cache if available, else from BCRA API)
router.get('/rates/latest', async (req: Request, res: Response) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    let cacheKey = getCacheKey('rates', today);
    let cachedData = cacheConfig.bcra.get(cacheKey);

    // Si no hay datos para hoy, buscar hacia atrás hasta 7 días
    if (!cachedData || !Array.isArray(cachedData) || cachedData.length === 0) {
      let found = false;
      for (let i = 1; i <= 7; i++) {
        const prevDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        cacheKey = getCacheKey('rates', prevDate);
        cachedData = cacheConfig.bcra.get(cacheKey);
        if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
          console.log(`[Cache] Latest rates served from cache for previous date: ${prevDate}`);
          found = true;
          break;
        }
      }
      if (found) {
        return res.json(cachedData);
      }
    } else {
      console.log('[Cache] Latest rates served from cache');
      return res.json(cachedData);
    }

    // Si no hay cache, consultar al BCRA
    console.log('[API] Fetching latest rates from BCRA API (no cache)');
    const response = await bcraService.getLatestExchangeRates();
    // Cachear el resultado por 1 hora
    cacheConfig.bcra.set(getCacheKey('rates', today), response, 60 * 60);
    res.json(response);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching latest exchange rates:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching latest exchange rates', details: axiosError.response?.data || axiosError.message });
  }
});

// Get exchange rates for a specific date
router.get('/rates/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);

    // NUEVO: Si la fecha pedida es hoy o futura, buscar la fecha más reciente en el cache
    if (dateObj >= today) {
      // Buscar la fecha más reciente en el cache
      const allKeys = cacheConfig.bcra.keys();
      const rateKeys = allKeys.filter(k => k.startsWith('rates_'));
      let bestKey = null;
      let bestDate = null;
      for (const key of rateKeys) {
        // Formato: rates_YYYY-MM-DD
        const parts = key.split('_');
        const maybeDate = parts[1];
        if (!maybeDate) continue;
        const keyDate = new Date(maybeDate);
        if (!bestDate || keyDate > bestDate) {
          bestKey = key;
          bestDate = keyDate;
        }
      }
      if (bestKey && bestDate) {
        const bestRates = cacheConfig.bcra.get(bestKey);
        if (Array.isArray(bestRates) && bestRates.length > 0) {
          console.log(`[Cache] Rates for ${date} (hoy/futuro) respondido con la fecha más reciente: ${bestKey}`);
          return res.json(bestRates);
        }
      }
      // Si no hay nada en cache, intentar traer de la API (lógica fallback)
    }

    // Lógica original para fechas pasadas
    if (dateObj > today) {
      return res.status(400).json({ error: 'No hay cotizaciones para fechas futuras.' });
    }
    let cacheKey = getCacheKey('rates', date);
    let cachedData: any[] = cacheConfig.bcra.get(cacheKey) ?? [];
    // Si no hay datos para la fecha pedida, buscar la última fecha disponible hacia atrás (hasta 7 días)
    let tries = 0;
    let lastDateTried = new Date(dateObj);
    while ((!cachedData || cachedData.length === 0) && tries < 7) {
      lastDateTried.setDate(lastDateTried.getDate() - 1);
      const tryDateStr = format(lastDateTried, 'yyyy-MM-dd');
      cacheKey = getCacheKey('rates', tryDateStr);
      cachedData = cacheConfig.bcra.get(cacheKey) ?? [];
      tries++;
    }
    if (cachedData && cachedData.length > 0) {
      console.log(`[Cache] Rates for ${date} not found, served from previous available date: ${format(lastDateTried, 'yyyy-MM-dd')}`);
      return res.json(cachedData);
    }
    // Si no hay en cache, intentar traer de la API (y si tampoco, buscar hacia atrás)
    let data: any[] = [];
    tries = 0;
    lastDateTried = new Date(dateObj);
    while (data.length === 0 && tries < 7) {
      try {
        data = await bcraService.getExchangeRates(lastDateTried);
      } catch (e) {
        data = [];
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = [];
        lastDateTried.setDate(lastDateTried.getDate() - 1);
      }
      tries++;
    }
    if (data.length > 0) {
      const tryDateStr = format(lastDateTried, 'yyyy-MM-dd');
      cacheKey = getCacheKey('rates', tryDateStr);
      // Cachear el resultado
      cacheConfig.bcra.set(cacheKey, data, 24 * 60 * 60);
      console.log(`[API] Rates for ${date} not found, served from previous available date: ${tryDateStr}`);
      return res.json(data);
    }
    // Si no hay datos en ningún lado
    return res.json([]);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching exchange rates:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching exchange rates', details: axiosError.response?.data || axiosError.message });
  }
});

// Get exchange rates for a currency in a date range
router.get('/rates/:currency/:startDate/:endDate', async (req, res) => {
  try {
    const { currency, startDate, endDate } = req.params;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (endDateObj > today) {
      return res.status(400).json({ error: 'No hay cotizaciones para fechas futuras.' });
    }

    const cacheKey = getCacheKey('history', currency, startDate, endDate);
    const cachedData = cacheConfig.historical.get(cacheKey);
    
    if (cachedData) {
      console.log(`[Cache] History for ${currency} (${startDate}-${endDate}) served from historical cache, records: ${Array.isArray(cachedData) ? cachedData.length : 0}`);
      return res.json(cachedData);
    }

    console.log(`[Cache] Fetching history for ${currency} (${startDate}-${endDate}) from BCRA API`);
    const data = await bcraService.getExchangeRateHistory(currency, startDateObj, endDateObj);
    
    // Cache por 7 días para datos históricos
    cacheConfig.historical.set(cacheKey, data, 7 * 24 * 60 * 60);
    
    console.log(`[API] History for ${currency} (${startDate}-${endDate}) fetched from BCRA API, records: ${data.length}`);
    res.json(data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching currency rates:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching currency rates', details: axiosError.response?.data || axiosError.message });
  }
});

// Get historical data for all currencies at once (dynamic bulk endpoint)
router.get('/rates/history/bulk/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (endDateObj > today) {
      return res.status(400).json({ error: 'No hay cotizaciones para fechas futuras.' });
    }

    const cacheKey = getCacheKey('bulk_history', startDate, endDate);
    const cachedData = cacheConfig.historical.get(cacheKey);
    
    if (cachedData) {
      console.log(`[Cache] Bulk history (${startDate}-${endDate}) served from historical cache`);
      return res.json({ data: cachedData, rangoRealDevuelto: { startDate, endDate } });
    }

    // Buscar el último bulk cacheado disponible (menor o igual a hoy)
    const allKeys = cacheConfig.historical.keys();
    const bulkKeys = allKeys.filter(k => k.startsWith('bulk_history_'));
    let bestKey = null;
    let bestEndDate = null;
    let bestStartDate = null;
    for (const key of bulkKeys) {
      // Formato: bulk_history_YYYY-MM-DD_YYYY-MM-DD
      const parts = key.split('_');
      const maybeStart = parts[2];
      const maybeEnd = parts[3];
      if (!maybeStart || !maybeEnd) continue;
      const keyEndDate = new Date(maybeEnd);
      if (keyEndDate <= today && (!bestEndDate || keyEndDate > bestEndDate)) {
        bestKey = key;
        bestEndDate = keyEndDate;
        bestStartDate = new Date(maybeStart);
      }
    }
    if (bestKey && bestStartDate && bestEndDate) {
      const bestBulk = cacheConfig.historical.get(bestKey);
      console.log(`[Cache] Bulk history (${startDate}-${endDate}) not found, serving best available: ${bestKey}`);
      return res.json({
        data: bestBulk,
        rangoRealDevuelto: {
          startDate: bestStartDate.toISOString().slice(0, 10),
          endDate: bestEndDate.toISOString().slice(0, 10)
        }
      });
    } else if (bestKey) {
      // fallback defensivo
      const bestBulk = cacheConfig.historical.get(bestKey);
      return res.json({ data: bestBulk });
    }

    // Si no hay ningún bulk cacheado, intentar traer de la API SOLO si el rango pedido es válido y no futuro
    // Obtener la lista de monedas dinámicamente
    const currencies = await bcraService.getCurrencies();
    const allCodes = currencies.map(c => c.code);
    console.log(`[Cache] Fetching bulk history for ${allCodes.length} currencies (${startDate}-${endDate}) from BCRA API`);
    
    const bulkData: { [currency: string]: any[] } = {};
    
    // Fetch data for all currencies in parallel
    const promises = allCodes.map(async (currency) => {
      try {
        const data = await bcraService.getExchangeRateHistory(currency, startDateObj, endDateObj);
        return { currency, data };
      } catch (error) {
        console.error(`Error fetching history for ${currency}:`, error);
        return { currency, data: [] };
      }
    });
    
    const results = await Promise.all(promises);
    
    results.forEach(({ currency, data }) => {
      bulkData[currency] = data;
    });
    
    // Filtrar solo las monedas que tienen datos
    const currenciesWithData = Object.entries(bulkData).filter(([code, arr]) => Array.isArray(arr) && arr.length > 0);
    
    if (currenciesWithData.length > 0) {
      // Crear un objeto solo con las monedas que tienen datos
      const filteredBulkData: { [currency: string]: any[] } = {};
      currenciesWithData.forEach(([code, arr]) => {
        filteredBulkData[code] = arr;
      });
      
      // Cachear el resultado filtrado
      cacheConfig.historical.set(cacheKey, filteredBulkData, 7 * 24 * 60 * 60);
      
      Object.entries(filteredBulkData).forEach(([code, arr]) => {
        console.log(`[BulkHistory][API] ${code}: ${Array.isArray(arr) ? arr.length : 0} registros`);
      });
      console.log(`[API] Bulk history (${startDate}-${endDate}) fetched from BCRA API for ${Object.keys(filteredBulkData).length}/${allCodes.length} currencies`);
      return res.json({ data: filteredBulkData, rangoRealDevuelto: { startDate, endDate } });
    } else {
      console.warn(`[API] Bulk history (${startDate}-${endDate}) - no data found for any currency`);
      return res.status(404).json({ error: 'No se encontraron datos para el rango pedido. Intente con un rango anterior.' });
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching bulk currency rates:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching bulk currency rates', details: axiosError.response?.data || axiosError.message });
  }
});

// Cache management endpoints
router.delete('/cache/clear', (req, res) => {
  clearAllCaches();
  res.json({ message: 'All caches cleared successfully' });
});

router.get('/cache/stats', (req, res) => {
  const stats = getAllCacheStats();
  res.json(stats);
});

router.delete('/cache/:type', (req, res) => {
  const { type } = req.params;
  const cache = cacheConfig[type as keyof typeof cacheConfig];
  
  if (cache) {
    cache.flushAll();
    console.log(`[Cache] ${type} cache cleared manually`);
    res.json({ message: `${type} cache cleared successfully` });
  } else {
    res.status(400).json({ error: 'Invalid cache type' });
  }
});

// Cache warming endpoints
router.get('/cache-warming/status', (req, res) => {
  const jobs = cacheWarmingService.getJobsStatus();
  res.json({
    jobs,
    timestamp: new Date().toISOString()
  });
});

router.get('/cache-warming/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = cacheWarmingService.getJobStatus(jobId);
  
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

router.post('/cache-warming/run/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    await cacheWarmingService.runJob(jobId);
    res.json({ message: `Job ${jobId} started successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Error running job', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/cache-warming/run-all', async (req, res) => {
  try {
    await cacheWarmingService.runAllJobs();
    res.json({ message: 'All cache warming jobs started successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error running jobs', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export const exchangeRoutes = router; 