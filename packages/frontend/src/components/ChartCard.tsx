import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChartCardProps {
  title: string;
  data: any[];
  color?: string;
  height?: number;
  selectedCurrencies?: string[];
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  data, 
  color = '#3b82f6', 
  height = 300,
  selectedCurrencies
}) => {
  const { isDarkMode } = useTheme();
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#eab308', '#14b8a6', '#f43f5e'];
  
  const formatValue = (value: number) => {
    if (value > 1000) {
      return value.toLocaleString();
    }
    return value.toFixed(2);
  };

  const gridColor = isDarkMode ? '#374151' : '#f0f0f0';
  const textColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const tooltipBg = isDarkMode ? '#1f2937' : '#fff';
  const tooltipBorder = isDarkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: textColor }}
              stroke={textColor}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: textColor }}
              stroke={textColor}
              tickFormatter={formatValue}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? '#f9fafb' : '#111827'
              }}
              formatter={(value: number, name: string) => [formatValue(value), name]}
            />
            {selectedCurrencies
              ? selectedCurrencies.map((code, idx) => (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={code}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: colors[idx % colors.length] }}
                  />
                ))
              : <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartCard;