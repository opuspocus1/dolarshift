import { bcraService } from './bcraService';
import { cacheConfig, getCacheKey } from '../config/cache';
import { format, subDays } from 'date-fns';

interface CacheWarmingJob {
  id: string;
  type: 'rates' | 'bulk';
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun: Date | null;
  nextRun: Date | null;
  error?: string;
}

interface Currency {
  code: string;
  name: string;
}

class CacheWarmingService {
  private jobs: Map<string, CacheWarmingJob> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeJobs();
    this.startScheduler();
  }

  private initializeJobs() {
    // Job para cargar cotizaciones actuales
    this.jobs.set('latest-rates', {
      id: 'latest-rates',
      type: 'rates',
      status: 'pending',
      lastRun: null,
      nextRun: new Date()
    });

    // Job para precalentar el bulk de todas las monedas (último año)
    this.jobs.set('bulk-history', {
      id: 'bulk-history',
      type: 'bulk',
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
      return;
    }

    this.isRunning = true;
    console.log('[Cache Warming] Starting scheduled jobs...');

    try {
      // Ejecutar jobs en paralelo
      await Promise.all([
        this.warmLatestRatesCache(),
        this.warmBulkHistoryCache()
      ]);

      console.log('[Cache Warming] All jobs completed successfully');
    } catch (error) {
      console.error('[Cache Warming] Error running jobs:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async warmLatestRatesCache() {
    const job = this.jobs.get('latest-rates');
    if (!job) return;

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = format(now, 'yyyy-MM-dd');
      // Solo correr si es después de las 16:30 y no se corrió aún para hoy
      if ((currentHour < 16 || (currentHour === 16 && currentMinute < 30)) && job.lastRun && format(job.lastRun, 'yyyy-MM-dd') === todayStr) {
        // No es hora de warming o ya se corrió hoy
        job.nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30, 0, 0);
        job.status = 'pending';
        return;
      }
      job.status = 'running';
      job.lastRun = now;
      job.nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 30, 0, 0); // Próxima ejecución mañana a las 16:30

      console.log('[Cache Warming] Warming latest rates cache...');
      const latestRates = await bcraService.getLatestExchangeRates();
      if (Array.isArray(latestRates) && latestRates.length > 0) {
        const latestDate = latestRates[0]?.date || format(now, 'yyyy-MM-dd');
        const cacheKey = getCacheKey('rates', latestDate);
        cacheConfig.bcra.set(cacheKey, latestRates, 24 * 60 * 60); // 24 horas
        console.log(`[Cache Warming] Latest rates cached for ${latestDate}: ${latestRates.length} rates`);
        }
      job.status = 'completed';
      console.log('[Cache Warming] Latest rates cache warmed');
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Cache Warming] Error warming latest rates cache:', error);
    }
  }

  private async warmBulkHistoryCache() {
    const job = this.jobs.get('bulk-history');
    if (!job) return;

    try {
      job.status = 'running';
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // Próxima ejecución en 24 horas

      console.log('[Cache Warming] Warming bulk history cache...');
      const today = new Date();
      const endDate = subDays(today, 1); // Hasta ayer
      const startDate = subDays(today, 370); // Último año (370 días para cubrir variaciones)
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Obtener la lista dinámica de monedas
      const currencies = await bcraService.getCurrencies();
      const allCodes = currencies.map((c: Currency) => c.code);
      console.log(`[Cache Warming] Fetching bulk history for ${allCodes.length} currencies (${startDateStr} to ${endDateStr})`);

      const bulkData: { [currency: string]: any[] } = {};
      const promises = allCodes.map(async (currency: string) => {
        try {
          const data = await bcraService.getExchangeRateHistory(currency, startDate, endDate);
          bulkData[currency] = data;
        } catch (error) {
          console.error(`[Cache Warming] Error warming bulk history for ${currency}:`, error);
          bulkData[currency] = [];
        }
      });
      await Promise.all(promises);

      // Guardar en cache con la misma clave que el endpoint bulk
      const cacheKey = getCacheKey('bulk_history', startDateStr, endDateStr);
      cacheConfig.historical.set(cacheKey, bulkData, 7 * 24 * 60 * 60); // 7 días TTL
      console.log(`[Cache Warming] Bulk history cached for ${allCodes.length} currencies (${startDateStr} to ${endDateStr})`);

      job.status = 'completed';
      console.log('[Cache Warming] Bulk history cache warmed');
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Cache Warming] Error warming bulk history cache:', error);
    }
  }

  // Métodos públicos para control manual
  public async runJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    switch (job.type) {
      case 'rates':
        await this.warmLatestRatesCache();
        break;
      case 'bulk':
          await this.warmBulkHistoryCache();
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