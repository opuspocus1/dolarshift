import { bcraService } from './bcraService';
import { cacheConfig, getCacheKey } from '../config/cache';
import { format, subDays } from 'date-fns';
import { getArgentinaDate } from '../utils/getArgentinaDate';

interface CacheWarmingJob {
  id: string;
  type: 'currencies' | 'rates' | 'history';
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun: Date | null;
  nextRun: Date | null;
  error?: string;
}

class CacheWarmingService {
  private jobs: Map<string, CacheWarmingJob> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeJobs();
    this.startScheduler();
  }

  private initializeJobs() {
    // Job para cargar divisas
    this.jobs.set('currencies', {
      id: 'currencies',
      type: 'currencies',
      status: 'pending',
      lastRun: null,
      nextRun: new Date()
    });

    // Job para cargar cotizaciones actuales
    this.jobs.set('current-rates', {
      id: 'current-rates',
      type: 'rates',
      status: 'pending',
      lastRun: null,
      nextRun: new Date()
    });

    // Job para cargar cotizaciones históricas (últimos 7 días)
    this.jobs.set('historical-rates', {
      id: 'historical-rates',
      type: 'history',
      status: 'pending',
      lastRun: null,
      nextRun: new Date()
    });

    console.log('[Cache Warming] Jobs initialized');
  }

  private startScheduler() {
    // Ejecutar cada 30 minutos
    setInterval(() => {
      this.runScheduledJobs();
    }, 30 * 60 * 1000);

    // Ejecutar inmediatamente al iniciar
    setTimeout(() => {
      this.runScheduledJobs();
    }, 5000); // Esperar 5 segundos para que el servidor esté listo

    console.log('[Cache Warming] Scheduler started');
  }

  private async runScheduledJobs() {
    if (this.isRunning) {
      console.log('[Cache Warming] Jobs already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('[Cache Warming] Starting scheduled jobs...');

    try {
      // Ejecutar jobs en paralelo
      await Promise.all([
        this.warmCurrenciesCache(),
        this.warmCurrentRatesCache(),
        this.warmHistoricalRatesCache()
      ]);

      console.log('[Cache Warming] All jobs completed successfully');
    } catch (error) {
      console.error('[Cache Warming] Error running jobs:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async warmCurrenciesCache() {
    const job = this.jobs.get('currencies');
    if (!job) return;

    try {
      job.status = 'running';
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // Próxima ejecución en 24 horas

      console.log('[Cache Warming] Warming currencies cache...');
      
      const currencies = await bcraService.getCurrencies();
      const cacheKey = getCacheKey('currencies');
      cacheConfig.metadata.set(cacheKey, currencies, 24 * 60 * 60);

      job.status = 'completed';
      console.log(`[Cache Warming] Currencies cache warmed: ${currencies.length} currencies`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Cache Warming] Error warming currencies cache:', error);
    }
  }

  private async warmCurrentRatesCache() {
    const job = this.jobs.get('current-rates');
    if (!job) return;

    try {
      job.status = 'running';
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + 60 * 60 * 1000); // Próxima ejecución en 1 hora

      console.log('[Cache Warming] Warming current rates cache...');
      
      const realToday = await getArgentinaDate();
      const now = new Date();
      const today = now > realToday ? new Date(realToday) : now;

      const rates = await bcraService.getExchangeRates(today);
      const cacheKey = getCacheKey('rates', format(today, 'yyyy-MM-dd'));
      cacheConfig.bcra.set(cacheKey, rates, 60 * 60); // 1 hora TTL

      job.status = 'completed';
      console.log(`[Cache Warming] Current rates cache warmed: ${rates.length} rates`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Cache Warming] Error warming current rates cache:', error);
    }
  }

  private async warmHistoricalRatesCache() {
    const job = this.jobs.get('historical-rates');
    if (!job) return;

    try {
      job.status = 'running';
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // Próxima ejecución en 24 horas

      console.log('[Cache Warming] Warming historical rates cache...');
      
      const realToday = await getArgentinaDate();
      const now = new Date();
      const today = now > realToday ? new Date(realToday) : now;

      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'CLP']; // Principales divisas
      
      for (const currency of currencies) {
        try {
          const startDate = subDays(today, 7);
          const history = await bcraService.getExchangeRateHistory(currency, startDate, today);
          const cacheKey = getCacheKey('history', currency, format(startDate, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
          cacheConfig.historical.set(cacheKey, history, 7 * 24 * 60 * 60); // 7 días TTL
          
          console.log(`[Cache Warming] Historical cache warmed for ${currency}: ${history.length} records`);
        } catch (error) {
          console.error(`[Cache Warming] Error warming historical cache for ${currency}:`, error);
        }
      }

      job.status = 'completed';
      console.log('[Cache Warming] Historical rates cache warmed');
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Cache Warming] Error warming historical rates cache:', error);
    }
  }

  // Métodos públicos para control manual
  public async runJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    switch (job.type) {
      case 'currencies':
        await this.warmCurrenciesCache();
        break;
      case 'rates':
        await this.warmCurrentRatesCache();
        break;
      case 'history':
        await this.warmHistoricalRatesCache();
        break;
    }
  }

  public async runAllJobs() {
    await this.runScheduledJobs();
  }

  public getJobsStatus(): CacheWarmingJob[] {
    return Array.from(this.jobs.values());
  }

  public getJobStatus(jobId: string): CacheWarmingJob | null {
    return this.jobs.get(jobId) || null;
  }
}

// Crear instancia singleton
export const cacheWarmingService = new CacheWarmingService(); 