const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');

// CORS configuration (debe ir antes de cualquier ruta)
app.use(cors({
  origin: 'https://dolarshift.netlify.app',
  credentials: true // Por si en el futuro necesitás cookies/autenticación
}));

// Manejo explícito de preflight (opcional, pero ayuda con algunos proxies)
app.options('*', cors({
  origin: 'https://dolarshift.netlify.app',
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.get('/api/exchange/rates/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const url = `https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones?fecha=${date}`;
    const response = await axios.get(url);
    const results = response.data.results?.detalle || [];
    const rates = {};
    for (const item of results) {
      const code = item.codigoMoneda;
      if (!rates[code]) {
        rates[code] = { code, name: item.descripcion, buy: null, sell: null };
      }
      if (item.tipoPase === 0) {
        rates[code].buy = item.tipoCotizacion;
        rates[code].sell = item.tipoCotizacion;
      } else if (item.tipoPase === 1) {
        rates[code].buy = item.tipoCotizacion;
      } else if (item.tipoPase === 2) {
        rates[code].sell = item.tipoCotizacion;
      }
    }
    res.json({ date, rates });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      res.json({ date, rates: {} });
    } else {
      res.status(500).json({ error: 'Error fetching BCRA rates', details: err.message });
    }
  }
});

// Ruta real para historial de una moneda entre dos fechas usando la API del BCRA
app.get('/api/exchange/rates/:currency/:startDate/:endDate', async (req, res) => {
  const { currency, startDate, endDate } = req.params;
  try {
    const url = `https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/${currency}?fechaDesde=${startDate}&fechaHasta=${endDate}`;
    const response = await axios.get(url);
    console.log('BCRA RAW RESPONSE:', JSON.stringify(response.data, null, 2));
    const results = response.data.results || [];
    const history = results.map(item => {
      let value = null;
      if (Array.isArray(item.detalle) && item.detalle.length > 0) {
        value = item.detalle[0].tipoCotizacion;
      }
      return {
        date: item.fecha,
        buy: value,
        sell: value
      };
    });
    res.json(history);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn('BCRA 404 Not Found:', err.message, err.response && err.response.data);
      res.json([]);
    } else {
      // Logs exhaustivos
      console.error('Error fetching BCRA history:', err);
      if (err.stack) console.error('Stack:', err.stack);
      if (err.response) console.error('Response:', err.response.data);
      if (err.request) console.error('Request:', err.request);
      if (err.config) console.error('Config:', err.config);
      res.status(500).json({ error: 'Error fetching BCRA history', details: err.message, stack: err.stack, bcra: err.response && err.response.data });
    }
  }
});

// Health check route
app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

// 404 handler - debe ir después de todas las rutas
app.use((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://dolarshift.netlify.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.setHeader('Access-Control-Allow-Origin', 'https://dolarshift.netlify.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.get('/api/exchange/currencies', async (req, res) => {
  try {
    const url = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Maestros/Divisas';
    const response = await axios.get(url);
    const results = response.data.results || [];
    const currencies = results.map(item => ({
      code: item.codigo,
      name: item.denominacion
    }));
    res.json(currencies);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching currencies', details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: https://dolarshift.netlify.app`);
});

// SOLO PARA PRUEBAS: deshabilitar verificación de certificados SSL (NO USAR EN PRODUCCIÓN)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 