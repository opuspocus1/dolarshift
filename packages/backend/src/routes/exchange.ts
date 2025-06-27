import { Router } from 'express';
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

// Get exchange rates for a specific date
router.get('/rates/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const dateObj = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateObj > today) {
      return res.status(400).json({ error: 'No hay cotizaciones para fechas futuras.' });
    }

    const cacheKey = getCacheKey('rates', date);
    const cachedData = cacheConfig.bcra.get(cacheKey);
    
    if (cachedData) {
      console.log(`[Cache] Rates for ${date} served from BCRA cache`);
      return res.json(cachedData);
    }

    console.log(`[Cache] Fetching rates for ${date} from BCRA API`);
    const data = await bcraService.getExchangeRates(dateObj);
    
    // Cache por 1 hora para datos actuales, 24 horas para históricos
    const ttl = isToday(dateObj) ? 60 * 60 : 24 * 60 * 60;
    cacheConfig.bcra.set(cacheKey, data, ttl);
    
    res.json(data);
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
      console.log(`[Cache] History for ${currency} (${startDate}-${endDate}) served from historical cache`);
      return res.json(cachedData);
    }

    console.log(`[Cache] Fetching history for ${currency} (${startDate}-${endDate}) from BCRA API`);
    const data = await bcraService.getExchangeRateHistory(currency, startDateObj, endDateObj);
    
    // Cache por 7 días para datos históricos
    cacheConfig.historical.set(cacheKey, data, 7 * 24 * 60 * 60);
    
    res.json(data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching currency rates:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching currency rates', details: axiosError.response?.data || axiosError.message });
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