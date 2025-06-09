import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { exchangeRoutes } from './routes/exchange';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  'https://dolarshift.netlify.app', // producción
  'http://localhost:5173'          // desarrollo local
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/exchange', exchangeRoutes);

// Endpoint para obtener la fecha actual del backend
app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware global para CORS en todas las respuestas (incluyendo 404)
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://dolarshift.netlify.app',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 