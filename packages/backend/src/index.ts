import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { exchangeRoutes } from './routes/exchange';
import { cacheWarmingService } from './services/cacheWarmingService'; // Importar el servicio para warming manual

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  'https://dolarshift.netlify.app', // producción
  'http://localhost:5173'          // desarrollo local
];

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply middleware in correct order
app.set('trust proxy', 1);
app.use(cors(corsOptions));
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
app.get('/api/time', (req: express.Request, res: express.Response) => {
  res.json({ now: new Date().toISOString() });
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server SOLO después de que el warming termine
async function startServer() {
  console.log('[Server] Warming up cache before starting HTTP server...');
  try {
    await cacheWarmingService.runAllJobs();
    console.log('[Server] Cache warming completed. Starting HTTP server...');
  } catch (err) {
    console.error('[Server] Error during cache warming:', err);
    // Si falla el warming, igual arrancar el server para no dejarlo caído
  }
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('[Cache Warming] Service initialized and will start warming cache automatically');
}); 
}

startServer(); 