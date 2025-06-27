import React, { useState, useEffect } from 'react';
import { exchangeService } from '../services/exchangeService';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
}

const CacheInfo: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchStats = async () => {
    try {
      const cacheStats = exchangeService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  };

  const clearCache = async () => {
    setIsLoading(true);
    try {
      exchangeService.clearCache();
      await fetchStats();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Cache Info
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showDetails ? '−' : '+'}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Items en cache:</span>
              <span className="font-mono">{stats.keys}</span>
            </div>
            <div className="flex justify-between">
              <span>Hits:</span>
              <span className="font-mono">{stats.hits}</span>
            </div>
            <div className="flex justify-between">
              <span>Misses:</span>
              <span className="font-mono">{stats.misses}</span>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={clearCache}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            {isLoading ? 'Limpiando...' : 'Limpiar Cache'}
          </button>
          <button
            onClick={fetchStats}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Los datos se actualizan automáticamente cada 24h
        </div>
      </div>
    </div>
  );
};

export default CacheInfo; 