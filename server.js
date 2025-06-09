const express = require('express');
const cors = require('cors');
const app = express();

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