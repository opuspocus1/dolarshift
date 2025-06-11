import React from 'react';
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
import { Line } from 'react-chartjs-2';
import { ExchangeRateHistory } from '../services/exchangeService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ExchangeRateChartProps {
  histories: Record<string, ExchangeRateHistory[]>;
  selectedCurrencies: string[];
  baseCurrency: string;
}

const ExchangeRateChart: React.FC<ExchangeRateChartProps> = ({
  histories,
  selectedCurrencies,
  baseCurrency
}) => {
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
  const sortedHistory = [...rawHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const labels = sortedHistory.map(h => new Date(h.date).toLocaleDateString());

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
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Exchange Rate History',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="w-full h-[500px] p-4">
      <Line options={options} data={data} />
    </div>
  );
};

export default ExchangeRateChart; 