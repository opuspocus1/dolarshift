import React, { useEffect, useRef, useState } from 'react';
import DollarTickerCard from './DollarTickerCard';
import { getDollarTickerData, DollarTickerData } from '../services/exchangeService';

const DollarTicker: React.FC = () => {
  const [data, setData] = useState<DollarTickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const pauseTimeout = useRef<number | null>(null);

  useEffect(() => {
    getDollarTickerData().then(setData).finally(() => setLoading(false));
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll JS en mobile, permitiendo scroll manual
  useEffect(() => {
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    let paused = false;
    let lastScrollLeft = 0;

    const onUserScroll = () => {
      paused = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (pauseTimeout.current) window.clearTimeout(pauseTimeout.current);
      pauseTimeout.current = window.setTimeout(() => {
        paused = false;
        startAutoScroll();
      }, 3000);
    };
    el.addEventListener('touchstart', onUserScroll);
    el.addEventListener('wheel', onUserScroll);
    el.addEventListener('mousedown', onUserScroll);

    function startAutoScroll() {
      if (!el) return;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        if (paused) return;
        el.scrollLeft += 1.2;
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
      if (pauseTimeout.current) window.clearTimeout(pauseTimeout.current);
      el.removeEventListener('touchstart', onUserScroll);
      el.removeEventListener('wheel', onUserScroll);
      el.removeEventListener('mousedown', onUserScroll);
    };
  }, [isMobile, data]);

  if (loading) return null;

  return (
    <div className="w-full bg-gray-900 dark:bg-gray-800 border-b border-gray-800 py-2">
      <div
        ref={scrollRef}
        className={
          isMobile
            ? 'flex gap-1 overflow-x-auto px-1 snap-x snap-mandatory scrollbar-hide'
            : 'flex gap-1 sm:gap-2 overflow-x-auto px-1 sm:px-2 sm:justify-center snap-x snap-mandatory scrollbar-hide'
        }
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