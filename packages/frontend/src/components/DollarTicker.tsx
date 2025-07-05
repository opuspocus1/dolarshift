import React, { useEffect, useState } from 'react';
import DollarTickerCard from './DollarTickerCard';
import { getDollarTickerData, DollarTickerData } from '../services/exchangeService';

const DollarTicker: React.FC = () => {
  const [data, setData] = useState<DollarTickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    getDollarTickerData().then(setData).finally(() => setLoading(false));
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return null;

  // Duplicar las tarjetas para efecto marquee infinito en mobile
  const marqueeCards = [...data, ...data];

  return (
    <div className="w-full bg-gray-900 dark:bg-gray-800 border-b border-gray-800 py-2">
      {/* Mobile: marquee animado, Desktop: fijo */}
      <div
        className={
          isMobile
            ? 'overflow-x-hidden relative'
            : 'flex gap-1 sm:gap-2 overflow-x-auto px-1 sm:px-2 sm:justify-center snap-x snap-mandatory scrollbar-hide'
        }
        style={isMobile ? { height: 56, minHeight: 56 } : {}}
      >
        {isMobile ? (
          <div
            className="flex gap-1 animate-marquee whitespace-nowrap"
            style={{ animationDuration: `${marqueeCards.length * 2.5}s` }}
          >
            {marqueeCards.map((d, i) => (
              <div className="snap-center" key={d.casa + '-' + i}>
                <DollarTickerCard
                  nombre={d.nombre}
                  compra={d.compra}
                  venta={d.venta}
                  variacion={d.variacionVenta}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {data.map((d) => (
              <div className="snap-center" key={d.casa}>
                <DollarTickerCard
                  nombre={d.nombre}
                  compra={d.compra}
                  venta={d.venta}
                  variacion={d.variacionVenta}
                />
              </div>
            ))}
          </>
        )}
      </div>
      {/* Animación marquee CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DollarTicker; 