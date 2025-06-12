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

const isDark = () => document.documentElement.classList.contains('dark');

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

  const dark = isDark();

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
        align: 'end',
        labels: {
          boxWidth: 18,
          boxHeight: 18,
          font: { size: 14, family: 'inherit', weight: 'bold' },
          color: dark ? '#fff' : '#22223b',
          padding: 18,
        },
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

  return (
    <div className={`w-full min-h-[320px] h-[50vh] max-h-[600px] p-1 md:p-2 rounded-lg shadow-2xl flex items-center justify-center ${dark ? 'bg-[#181e29]' : 'bg-white'}`}>
      <Line options={options} data={data} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default ExchangeRateChart; 