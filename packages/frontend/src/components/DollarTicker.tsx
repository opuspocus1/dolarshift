import React, { useEffect, useState } from 'react';
import DollarTickerCard from './DollarTickerCard';
import { getDollarTickerData, DollarTickerData } from '../services/exchangeService';

const DollarTicker: React.FC = () => {
  const [data, setData] = useState<DollarTickerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDollarTickerData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="w-full bg-gray-900 dark:bg-gray-800 border-b border-gray-800 py-2">
      <div className="flex justify-center gap-2 overflow-x-auto px-2">
        {data.map((d) => (
          <DollarTickerCard
            key={d.casa}
            nombre={d.nombre}
            compra={d.compra}
            venta={d.venta}
            variacion={d.variacionVenta}
          />
        ))}
      </div>
    </div>
  );
};

export default DollarTicker; 