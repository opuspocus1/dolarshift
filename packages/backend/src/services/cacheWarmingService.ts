import { bcraService } from './bcraService';
import { cacheConfig, getCacheKey } from '../config/cache';
import { format, subDays } from 'date-fns';

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

    // Job para precalentar el bulk de todas las monedas
    this.jobs.set('bulk-history', {
      id: 'bulk-history',
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
        this.warmHistoricalRatesCache(),
        this.warmBulkHistoryCache()
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
      const latestRates = await bcraService.getLatestExchangeRates();
      if (Array.isArray(latestRates) && latestRates.length > 0) {
        // Buscar la fecha real de los datos
        const latestDate = latestRates[0]?.date || format(new Date(), 'yyyy-MM-dd');
        const cacheKey = getCacheKey('rates', latestDate);
        cacheConfig.bcra.set(cacheKey, latestRates, 60 * 60); // 1 hora
        console.log(`[Cache Warming] Current rates cache warmed for ${latestDate}: ${latestRates.length} rates`);
      } else {
        console.warn('[Cache Warming] No latest rates to cache');
      }
      job.status = 'completed';
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
      
      // Usar fechas pasadas que sabemos que tienen datos disponibles
      const today = new Date();
      const endDate = subDays(today, 1); // Hasta ayer
      const startDate = subDays(today, 8); // Desde hace 8 días
      console.log(`[Cache Warming] Using historical date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'BRL', 'CLP']; // Principales divisas
      
      for (const currency of currencies) {
        try {
          console.log(`[Cache Warming] Fetching history for ${currency} (${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')})`);
          const history = await bcraService.getExchangeRateHistory(currency, startDate, endDate);
          const cacheKey = getCacheKey('history', currency, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));
          cacheConfig.historical.set(cacheKey, history, 7 * 24 * 60 * 60); // 7 días TTL
          console.log(`[Cache Warming] Historical cache set for ${currency} (${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}) with ${history.length} records`);
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
      const allCodes = currencies.map(c => c.code);
      console.log(`[Cache Warming] Fetching bulk history for ${allCodes.length} currencies (${startDateStr} to ${endDateStr})`);

      const bulkData: { [currency: string]: any[] } = {};
      const promises = allCodes.map(async (currency) => {
        try {
          const data = await bcraService.getExchangeRateHistory(currency, startDate, endDate);
          bulkData[currency] = data;
        } catch (error) {
          console.error(`[Cache Warming] Error warming bulk history for ${currency}:`, error);
          bulkData[currency] = [];
        }
      });
      await Promise.all(promises);

      // Log detallado de cuántos registros tiene cada moneda
      Object.entries(bulkData).forEach(([code, arr]) => {
        console.log(`[BulkData] ${code}: ${Array.isArray(arr) ? arr.length : 0} registros`);
      });

      // Guardar en cache con la misma clave que el endpoint bulk
      const cacheKey = getCacheKey('bulk_history', startDateStr, endDateStr);
      cacheConfig.historical.set(cacheKey, bulkData, 7 * 24 * 60 * 60); // 7 días TTL
      console.log(`[Cache Warming] Bulk history cache set for ${allCodes.length} currencies (${startDateStr} to ${endDateStr})`);

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
      case 'currencies':
        await this.warmCurrenciesCache();
        break;
      case 'rates':
        await this.warmCurrentRatesCache();
        break;
      case 'history':
        if (job.id === 'historical-rates') {
          await this.warmHistoricalRatesCache();
        } else if (job.id === 'bulk-history') {
          await this.warmBulkHistoryCache();
        }
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