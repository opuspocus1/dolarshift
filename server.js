const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://dolarshift.netlify.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Routes
app.get('/api/exchange/rates/:date', (req, res) => {
  const { date } = req.params;
  
  // Mock data - you can replace this with real data later
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

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
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