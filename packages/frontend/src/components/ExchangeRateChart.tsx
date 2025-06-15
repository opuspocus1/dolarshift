import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { ExchangeRateHistory, USD_QUOTED_CURRENCIES } from '../services/exchangeService';
import {
  Plus,
  Minus,
  Search,
  Hand,
  Home,
  Download
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

interface ExchangeRateChartProps {
  histories: Record<string, ExchangeRateHistory[]>;
  selectedCurrency: string;
  viewMode: 'USD' | 'ARS';
}

const getIsDark = () => document.documentElement.classList.contains('dark');

// Helper to find history item by date (normalize to YYYY-MM-DD)
function findHistoryItem(history: ExchangeRateHistory[] | undefined, date: string) {
  if (!history) return undefined;
  // Some APIs may return date as 'YYYY-MM-DDTHH:mm:ss...' or just 'YYYY-MM-DD'
  const target = date.slice(0, 10); // Always use YYYY-MM-DD
  return history.find(x => x.date.slice(0, 10) === target);
}

const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({
  histories,
  selectedCurrency,
  viewMode
}) => {
  const [dark, setDark] = useState(getIsDark());
  const chartRef = useRef<any>(null);
  const [panMode, setPanMode] = useState(false);
  const [zoomDrag, setZoomDrag] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(getIsDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  // Obtener y ordenar las fechas de menor a mayor
  const history = histories[selectedCurrency] || [];
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const labels = sortedHistory.map(h => {
    const [year, month, day] = h.date.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });

  // Calcular el dataset según la lógica del Dashboard
  let chartDataArray: number[] = [];
  let label = '';
  if (viewMode === 'USD') {
    if (selectedCurrency === 'ARS') {
      // ARS/USD: 1 / tipoPase
      chartDataArray = sortedHistory.map(h => {
        const item = findHistoryItem(histories['ARS'], h.date);
        return item && item.buy ? 1 / item.buy : 0;
      });
      label = 'ARS/USD';
    } else if (selectedCurrency === 'USD') {
      // USD/USD: 1
      chartDataArray = sortedHistory.map(() => 1);
      label = 'USD/USD';
    } else if (selectedCurrency === 'XAU' || selectedCurrency === 'XAG') {
      // XAU/USD, XAG/USD: tipoPase
      chartDataArray = sortedHistory.map(h => {
        const item = findHistoryItem(histories[selectedCurrency], h.date);
        return item && item.buy ? item.buy : 0;
      });
      label = `${selectedCurrency}/USD`;
    } else if (USD_QUOTED_CURRENCIES.includes(selectedCurrency)) {
      // XXX/USD: 1 / (USD/XXX)
      chartDataArray = sortedHistory.map(h => {
        const item = findHistoryItem(histories[selectedCurrency], h.date);
        return item && item.buy ? 1 / item.buy : 0;
      });
      label = `${selectedCurrency}/USD`;
    } else {
      // USD/XXX: USD/ARS / XXX/ARS
      chartDataArray = sortedHistory.map(h => {
        const usdItem = findHistoryItem(histories['USD'], h.date);
        const item = findHistoryItem(histories[selectedCurrency], h.date);
        if (!usdItem || !item || !usdItem.buy || !item.buy) return 0;
        return usdItem.buy / item.buy;
      });
      label = `USD/${selectedCurrency}`;
    }
  } else {
    // Lógica de la derecha del Dashboard
    if (selectedCurrency === 'ARS') {
      // ARS/ARS: 1
      chartDataArray = sortedHistory.map(() => 1);
      label = 'ARS/ARS';
    } else if (selectedCurrency === 'USD') {
      // USD/ARS: tipoCotizacion
      chartDataArray = sortedHistory.map(h => {
        const item = findHistoryItem(histories['USD'], h.date);
        return item && item.buy ? item.buy : 0;
      });
      label = 'USD/ARS';
    } else if (selectedCurrency === 'XAU' || selectedCurrency === 'XAG') {
      // XAU/ARS, XAG/ARS: no se calcula, mostrar null o vacío
      chartDataArray = sortedHistory.map(() => NaN);
      label = `${selectedCurrency}/ARS`;
    } else {
      // XXX/ARS: tipoCotizacion
      chartDataArray = sortedHistory.map(h => {
        const item = findHistoryItem(histories[selectedCurrency], h.date);
        return item && item.buy ? item.buy : 0;
      });
      label = `${selectedCurrency}/ARS`;
    }
  }

  const datasets = [
    {
      label,
      data: chartDataArray,
      borderColor: colors[0],
      backgroundColor: colors[0],
      tension: 0.4,
    }
  ];

  const data = {
    labels,
    datasets,
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
        text: '',
      },
      tooltip: {
        backgroundColor: dark ? '#22223b' : '#fff',
        titleColor: dark ? '#fff' : '#22223b',
        bodyColor: dark ? '#fff' : '#22223b',
        borderColor: '#38bdf8',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        caretSize: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      },
      zoom: {
        pan: {
          enabled: panMode,
          mode: 'xy',
        },
        zoom: {
          wheel: { enabled: !zoomDrag },
          pinch: { enabled: !zoomDrag },
          drag: { enabled: zoomDrag, modifierKey: 'ctrl' },
          mode: 'xy',
        },
        limits: {
          x: { min: 'original', max: 'original' },
          y: { min: 'original', max: 'original' }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: dark ? '#334155' : '#e5e7eb' },
        ticks: {
          color: dark ? '#fff' : '#22223b',
          font: { size: 13 },
          callback: function(value) {
            return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        },
      },
      x: {
        grid: { color: dark ? '#334155' : '#e5e7eb' },
        ticks: { color: dark ? '#fff' : '#22223b', font: { size: 13 } },
      },
    },
  };

  // Funciones de control
  const handleZoomIn = () => {
    const chart = chartRef.current;
    if (chart) chart.zoom(1.2);
  };
  const handleZoomOut = () => {
    const chart = chartRef.current;
    if (chart) chart.zoom(0.8);
  };
  const handleReset = () => {
    const chart = chartRef.current;
    if (chart) chart.resetZoom();
  };
  const handleDownload = () => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart.png';
      link.click();
    }
  };
  const handlePan = () => {
    setPanMode((prev) => !prev);
    setZoomDrag(false);
  };
  const handleZoomDrag = () => {
    setZoomDrag((prev) => !prev);
    setPanMode(false);
  };

  return (
    <div className="w-full">
      {/* Controles del gráfico */}
      <div className="flex justify-end space-x-2 mb-4">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Acercar"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Alejar"
        >
          <Minus size={20} />
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Resetear zoom"
        >
          <Home size={20} />
        </button>
        <button
          onClick={handlePan}
          className={`p-2 rounded-md transition-colors ${
            panMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Modo pan"
        >
          <Hand size={20} />
        </button>
        <button
          onClick={handleZoomDrag}
          className={`p-2 rounded-md transition-colors ${
            zoomDrag
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title="Modo zoom"
        >
          <Search size={20} />
        </button>
        <button
          onClick={handleDownload}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Descargar gráfico"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Contenedor del gráfico con altura fija */}
      <div className="relative w-full" style={{ height: '600px' }}>
        <Line
          ref={chartRef}
          data={data}
          options={options}
          className="w-full h-full"
        />
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-2">
        {datasets.map((dataset, index) => (
          <div
            key={dataset.label}
            className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: dataset.borderColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {dataset.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExchangeRateChart; 