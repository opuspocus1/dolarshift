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
import { ExchangeRateHistory } from '../services/exchangeService';
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
  selectedCurrencies: string[];
  baseCurrency: string;
}

const getIsDark = () => document.documentElement.classList.contains('dark');

const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({
  histories,
  selectedCurrencies,
  baseCurrency
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
  const rawHistory = histories[selectedCurrencies[0]] || [];
  console.log('Historial recibido:', rawHistory);
  const sortedHistory = [...rawHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  console.log('Fechas en sortedHistory:', sortedHistory.map(h => h.date));
  const labels = sortedHistory.map(h => {
    const [year, month, day] = h.date.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });
  console.log('Labels del gráfico:', labels);

  // Mapear los datasets usando el orden de sortedHistory
  const datasets = selectedCurrencies
    .filter(currency => currency !== baseCurrency)
    .map((currency, index) => {
      const history = histories[currency] || [];
      // Ordenar el history según el orden de las fechas en sortedHistory
      const historyMap = Object.fromEntries(history.map(h => [h.date, h]));
      let data: number[] = [];
      let label = `${currency}/${baseCurrency}`;
      if (baseCurrency !== 'ARS') {
        data = sortedHistory.map(h => {
          const item = historyMap[h.date];
          return item && item.buy ? 1 / item.buy : 0;
        });
        label = `${baseCurrency}/${currency}`;
      } else {
        data = sortedHistory.map(h => {
          const item = historyMap[h.date];
          return item ? item.buy : 0;
        });
      }
      return {
        label,
        data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        tension: 0.4,
      };
    });

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
        ticks: { color: dark ? '#fff' : '#22223b', font: { size: 13 } },
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
    <div className={`relative w-full min-h-[320px] h-[50vh] max-h-[600px] p-1 md:p-2 rounded-lg shadow-2xl flex items-center justify-center ${dark ? 'bg-[#181e29]' : 'bg-white'}`}>
      {/* Leyenda custom a la izquierda */}
      <div className="absolute top-3 left-3 flex flex-row items-center gap-3 z-10">
        {datasets.map((ds, i) => (
          <div key={ds.label} className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full" style={{ background: ds.borderColor }}></span>
            <span className="text-xs font-semibold" style={{ color: dark ? '#fff' : '#22223b' }}>{ds.label}</span>
          </div>
        ))}
      </div>
      {/* Controles visuales a la derecha */}
      <div className="absolute top-3 right-3 flex flex-row items-center gap-2 z-10">
        <button onClick={handleZoomIn} title="Zoom in" className="rounded-full p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <Plus className="w-5 h-5 text-gray-700 dark:text-gray-100" />
        </button>
        <button onClick={handleZoomOut} title="Zoom out" className="rounded-full p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <Minus className="w-5 h-5 text-gray-700 dark:text-gray-100" />
        </button>
        <button onClick={handleZoomDrag} title="Zoom con selección" className={`rounded-full p-1.5 border shadow transition-colors ${zoomDrag ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}>
          <Search className="w-5 h-5 text-gray-700 dark:text-gray-100" />
        </button>
        <button onClick={handlePan} title="Pan" className={`rounded-full p-1.5 border shadow transition-colors ${panMode ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}>
          <Hand className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </button>
        <button onClick={handleReset} title="Reset" className="rounded-full p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
          <Home className="w-5 h-5 text-gray-700 dark:text-gray-100" />
        </button>
        <button onClick={handleDownload} title="Descargar" className="rounded-full p-1.5 bg-purple-200 hover:bg-purple-300 dark:bg-purple-700 dark:hover:bg-purple-600 border border-purple-400 dark:border-purple-700 shadow transition-colors">
          <Download className="w-5 h-5 text-purple-800 dark:text-white" />
        </button>
      </div>
      <Line ref={chartRef} options={options} data={data} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ExchangeRateChart; 