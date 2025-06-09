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
app.get('/api/exchange/rates/:date', (req, res) => {
  const { date } = req.params;
  
  // Mock data - you can reemplazar esto por datos reales después
  const mockRates = {
    date,
    rates: {
      USD: {
        buy: 123.45,
        sell: 125.67,
        timestamp: new Date().toISOString()
      },
      EUR: {
        buy: 135.67,
        sell: 137.89,
        timestamp: new Date().toISOString()
      }
    }
  };

  res.json(mockRates);
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
      let buy = null;
      let sell = null;
      if (Array.isArray(item.detalle)) {
        for (const d of item.detalle) {
          if (d.tipoPase === 1) buy = d.tipoCotizacion;
          if (d.tipoPase === 2) sell = d.tipoCotizacion;
        }
      }
      return {
        date: item.fecha,
        buy,
        sell
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
  res.json({ 
    time: new Date().toISOString(),
    status: 'ok'
  });
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

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: https://dolarshift.netlify.app`);
});

// SOLO PARA PRUEBAS: deshabilitar verificación de certificados SSL (NO USAR EN PRODUCCIÓN)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 