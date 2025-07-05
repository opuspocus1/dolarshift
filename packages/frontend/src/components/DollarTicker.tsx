import React, { useEffect, useRef, useState } from 'react';
import DollarTickerCard from './DollarTickerCard';
import { getDollarTickerData, DollarTickerData } from '../services/exchangeService';

const isMobile = () => window.innerWidth < 640;

const DollarTicker: React.FC = () => {
  const [data, setData] = useState<DollarTickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [mobile, setMobile] = useState(isMobile());

  useEffect(() => {
    getDollarTickerData().then(setData).finally(() => setLoading(false));
    const handleResize = () => setMobile(isMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll en mobile
  useEffect(() => {
    if (!mobile) return;
    const el = scrollRef.current;
    if (!el) return;
    let paused = false;
    const onUserScroll = () => {
      paused = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      // Reanudar auto-scroll después de 3s sin interacción
      setTimeout(() => { paused = false; startAutoScroll(); }, 3000);
    };
    el.addEventListener('touchstart', onUserScroll);
    el.addEventListener('wheel', onUserScroll);
    function startAutoScroll() {
      if (!el) return;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        if (paused) return;
        el.scrollLeft += 1.8; // velocidad aumentada
        // Si llegó al final, vuelve al inicio
        if (el.scrollLeft + el.offsetWidth >= el.scrollWidth - 2) {
          el.scrollLeft = 0;
        }
      }, 16);
    }
    // Pequeño delay para asegurar que el render y el ancho estén listos
    setTimeout(startAutoScroll, 300);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      el.removeEventListener('touchstart', onUserScroll);
      el.removeEventListener('wheel', onUserScroll);
    };
  }, [mobile, data]);

  if (loading) return null;

  return (
    <div className="w-full bg-gray-900 dark:bg-gray-800 border-b border-gray-800 py-2">
      <div
        ref={scrollRef}
        className="flex gap-1 sm:gap-2 overflow-x-auto px-1 sm:px-2 sm:justify-center snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
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
      </div>
    </div>
  );
};

export default DollarTicker; 