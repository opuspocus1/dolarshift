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
import { eachDayOfInterval, format as formatDateFns } from 'date-fns';

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

  // Obtener el rango de fechas completo del primer y último dato
  let allDates: Date[] = [];
  if (sortedHistory.length > 0) {
    const start = new Date(sortedHistory[0].date);
    const end = new Date(sortedHistory[sortedHistory.length - 1].date);
    allDates = eachDayOfInterval({ start, end });
  }
  const labels = allDates.map(d => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });

  // Mapear los datasets usando el orden de allDates, rellenando con null si no hay dato
  const datasets = selectedCurrencies
    .filter(currency => currency !== baseCurrency)
    .map((currency, index) => {
      const history = histories[currency] || [];
      const historyMap = Object.fromEntries(history.map(h => [formatDateFns(new Date(h.date), 'yyyy-MM-dd'), h]));
      let data: (number | null)[] = [];
      let label = `${currency}/${baseCurrency}`;
      if (baseCurrency !== 'ARS') {
        data = allDates.map(d => {
          const key = formatDateFns(d, 'yyyy-MM-dd');
          const item = historyMap[key];
          return item && item.buy ? 1 / item.buy : null;
        });
        label = `${baseCurrency}/${currency}`;
      } else {
        data = allDates.map(d => {
          const key = formatDateFns(d, 'yyyy-MM-dd');
          const item = historyMap[key];
          return item ? item.buy : null;
        });
      }
      return {
        label,
        data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        tension: 0.4,
        spanGaps: false,
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
        align: 'end',
        labels: {
          boxWidth: 18,
          boxHeight: 18,
          font: { size: 14, family: 'inherit', weight: 'bold' },
          color: '#222',
          padding: 18,
        },
      },
      title: {
        display: false,
        text: '',
      },
      tooltip: {
        backgroundColor: 'rgba(30,41,59,0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
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
        grid: { color: '#e5e7eb' },
        ticks: { color: '#222', font: { size: 13 } },
      },
      x: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#222', font: { size: 13 } },
      },
    },
  };

  return (
    <div className="w-full h-[520px] p-2 md:p-6 bg-white/90 rounded-2xl shadow-2xl flex items-center justify-center">
      <Line options={options} data={data} />
    </div>
  );
};

export default ExchangeRateChart; 