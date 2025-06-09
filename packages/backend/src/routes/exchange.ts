import { Router } from 'express';
import NodeCache from 'node-cache';
import { bcraService } from '../services/bcraService';
import { format, subDays } from 'date-fns';
import { AxiosError } from 'axios';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Get all available currencies
router.get('/currencies', async (req, res) => {
  try {
    const cacheKey = 'currencies';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const data = await bcraService.getCurrencies();
    cache.set(cacheKey, data);
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
    const cacheKey = `rates_${date}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const dateObj = new Date(date);
    const data = await bcraService.getExchangeRates(dateObj);
    cache.set(cacheKey, data);
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
    const cacheKey = `rates_${currency}_${startDate}_${endDate}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const data = await bcraService.getExchangeRateHistory(currency, startDateObj, endDateObj);
    cache.set(cacheKey, data);
    res.json(data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching currency rates:', axiosError.response?.data || axiosError.message);
    res.status(500).json({ error: 'Error fetching currency rates', details: axiosError.response?.data || axiosError.message });
  }
});

export const exchangeRoutes = router; 