import { Router } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

const BCRA_API_BASE_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0';

// Get all available currencies
router.get('/currencies', async (req, res) => {
  try {
    const cacheKey = 'currencies';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await axios.get(`${BCRA_API_BASE_URL}/Maestros/Divisas`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      }
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching currencies:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching currencies', details: error.response?.data || error.message });
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

    const response = await axios.get(`${BCRA_API_BASE_URL}/Cotizaciones`, {
      params: { fecha: date },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      }
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching exchange rates:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching exchange rates', details: error.response?.data || error.message });
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

    const response = await axios.get(`${BCRA_API_BASE_URL}/Cotizaciones/${currency}`, {
      params: {
        fechaDesde: startDate,
        fechaHasta: endDate
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DolarShift/1.0; +https://dolarshift.com)'
      }
    });
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching currency rates:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching currency rates', details: error.response?.data || error.message });
  }
});

export const exchangeRoutes = router; 