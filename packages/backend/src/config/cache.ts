import NodeCache from 'node-cache';

// Configuración optimizada del cache para datos del BCRA
export const cacheConfig = {
  // Cache principal para datos del BCRA
  bcra: new NodeCache({
    stdTTL: 24 * 60 * 60, // 24 horas en segundos
    checkperiod: 60 * 60, // Verificar expiración cada hora
    useClones: false, // Mejor rendimiento
    maxKeys: 1000, // Máximo 1000 claves en cache
    deleteOnExpire: true // Eliminar automáticamente al expirar
  }),

  // Cache para datos históricos (más largo)
  historical: new NodeCache({
    stdTTL: 7 * 24 * 60 * 60, // 7 días para datos históricos
    checkperiod: 24 * 60 * 60, // Verificar expiración cada día
    useClones: false,
    maxKeys: 500,
    deleteOnExpire: true
  }),

  // Cache para metadatos (currencies, etc.)
  metadata: new NodeCache({
    stdTTL: 24 * 60 * 60, // 24 horas
    checkperiod: 60 * 60,
    useClones: false,
    maxKeys: 100,
    deleteOnExpire: true
  })
};

// Función para obtener la clave de cache inteligente
export function getCacheKey(type: string, ...params: string[]): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${type}_${today}_${params.join('_')}`;
}

// Función para limpiar todos los caches
export function clearAllCaches(): void {
  Object.values(cacheConfig).forEach(cache => cache.flushAll());
  console.log('[Cache] All caches cleared');
}

// Función para obtener estadísticas de todos los caches
export function getAllCacheStats() {
  return {
    bcra: cacheConfig.bcra.getStats(),
    historical: cacheConfig.historical.getStats(),
    metadata: cacheConfig.metadata.getStats()
  };
}

// Función para limpiar caches expirados
export function cleanupExpiredCaches(): void {
  Object.entries(cacheConfig).forEach(([name, cache]) => {
    cache.prune();
    console.log(`[Cache] Cleaned up expired entries from ${name} cache`);
  });
}

// Programar limpieza automática cada 6 horas
setInterval(cleanupExpiredCaches, 6 * 60 * 60 * 1000); 