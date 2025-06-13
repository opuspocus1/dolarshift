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
  selectedPairs: string[];
}

const getIsDark = () => document.documentElement.classList.contains('dark');

const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({
  histories,
  selectedPairs
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
  // Usar la historia de la primer moneda del primer par para las fechas
  const firstPair = selectedPairs[0] || '';
  const [base, quote] = firstPair.split('/');
  const rawHistory = histories[base] || histories[quote] || [];
  const sortedHistory = [...rawHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const labels = sortedHistory.map(h => {
    const [year, month, day] = h.date.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  });

  // Mapear los datasets usando la lógica exacta del Dashboard
  const datasets = selectedPairs.map((pair, index) => {
    const [base, quote] = pair.split('/');
    const baseHistory = histories[base] || [];
    const quoteHistory = histories[quote] || [];
    const baseMap = Object.fromEntries(baseHistory.map(h => [h.date, h]));
    const quoteMap = Object.fromEntries(quoteHistory.map(h => [h.date, h]));
    let data: number[] = [];
    let label = pair;

    if (pair === 'ARS/USD') {
      // ARS/USD: 1 / tipoPase (tipoPase = USD/ARS)
      data = sortedHistory.map(h => {
        const item = baseMap[h.date];
        return item && item.buy ? 1 / item.buy : 0;
      });
    } else if (pair === 'USD/USD') {
      // USD/USD: always 1
      data = sortedHistory.map(() => 1);
    } else if (pair === 'XAU/USD' || pair === 'XAG/USD') {
      // XAU/USD, XAG/USD: tipoPase
      data = sortedHistory.map(h => {
        const item = baseMap[h.date];
        return item && item.buy ? item.buy : 0;
      });
    } else if (pair.startsWith('USD/')) {
      // USD/XXX: USD.tipoCotizacion / XXX.tipoCotizacion
      data = sortedHistory.map(h => {
        const usdItem = quoteMap[h.date];
        const baseItem = baseMap[h.date];
        if (!usdItem || !baseItem || !usdItem.buy || !baseItem.buy) return 0;
        return usdItem.buy / baseItem.buy;
      });
    } else {
      // Fallback: base/quote
      data = sortedHistory.map(h => {
        const baseItem = baseMap[h.date];
        const quoteItem = quoteMap[h.date];
        if (!baseItem || !quoteItem || !baseItem.buy || !quoteItem.buy) return 0;
        return baseItem.buy / quoteItem.buy;
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