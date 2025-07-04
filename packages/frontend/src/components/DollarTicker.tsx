import React, { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
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
    <div className="w-full bg-gray-900 border-b border-gray-800 py-2">
      <Marquee gradient={false} speed={40} pauseOnHover>
        {data.map((d) => (
          <DollarTickerCard
            key={d.casa}
            nombre={d.nombre}
            compra={d.compra}
            venta={d.venta}
            variacion={d.variacionVenta}
          />
        ))}
      </Marquee>
    </div>
  );
};

export default DollarTicker; 