import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface CacheWarmingJob {
  id: string;
  type: 'currencies' | 'rates' | 'history';
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun: string | null;
  nextRun: string | null;
  error?: string;
}

interface CacheWarmingStatus {
  jobs: CacheWarmingJob[];
  timestamp: string;
}

const CacheWarmingStatus: React.FC = () => {
  const [status, setStatus] = useState<CacheWarmingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dolarshift.onrender.com/api';

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/exchange/cache-warming/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching cache warming status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runJob = async (jobId: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/exchange/cache-warming/run/${jobId}`);
      await fetchStatus(); // Refresh status
      console.log(`Job ${jobId} started successfully`);
    } catch (error) {
      console.error(`Error running job ${jobId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const runAllJobs = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/exchange/cache-warming/run-all`);
      await fetchStatus(); // Refresh status
      console.log('All jobs started successfully');
    } catch (error) {
      console.error('Error running all jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Falló';
      case 'running':
        return 'Ejecutando';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const getJobName = (jobId: string) => {
    switch (jobId) {
      case 'currencies':
        return 'Divisas';
      case 'current-rates':
        return 'Cotizaciones Actuales';
      case 'historical-rates':
        return 'Cotizaciones Históricas';
      default:
        return jobId;
    }
  };

  useEffect(() => {
    fetchStatus();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const completedJobs = status.jobs.filter(job => job.status === 'completed').length;
  const totalJobs = status.jobs.length;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Cache Warming
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedJobs}/{totalJobs}
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showDetails ? '−' : '+'}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2 mb-3">
            {status.jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  <span className="text-gray-700 dark:text-gray-300">
                    {getJobName(job.id)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' :
                    job.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {getStatusText(job.status)}
                  </span>
                  <button
                    onClick={() => runJob(job.id)}
                    disabled={loading || job.status === 'running'}
                    className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Ejecutar job"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={runAllJobs}
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Todos'}
          </button>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white text-xs px-3 py-1 rounded transition-colors"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Última actualización: {new Date(status.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default CacheWarmingStatus; 