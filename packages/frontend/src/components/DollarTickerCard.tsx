import React from 'react';

interface Props {
  nombre: string;
  compra: number | null;
  venta: number | null;
  variacion: number | null; // % respecto a ayer
}

const getColor = (variacion: number | null) => {
  if (variacion === null || isNaN(variacion)) return 'text-gray-400';
  if (variacion > 0) return 'text-green-400';
  if (variacion < 0) return 'text-red-400';
  return 'text-gray-400';
};

const getTriangle = (variacion: number | null) => {
  if (variacion === null || isNaN(variacion)) return null;
  if (variacion > 0) return <span className="inline-block align-middle">▲</span>;
  if (variacion < 0) return <span className="inline-block align-middle">▼</span>;
  return null;
};

const formatNumber = (n: number | null) =>
  n === null ? '-' : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DollarTickerCard: React.FC<Props> = ({ nombre, compra, venta, variacion }) => (
  <div className="flex flex-col items-center justify-center px-2 min-w-[100px] bg-gray-800 dark:bg-gray-900 rounded-md shadow-sm py-2">
    <div className="text-xs text-gray-300 font-semibold uppercase mb-1 tracking-wide text-center whitespace-nowrap">{nombre}</div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-white leading-tight">{formatNumber(venta)}</span>
      <span className="text-xs text-gray-400 font-semibold leading-tight">/ {formatNumber(compra)}</span>
    </div>
    <div className={`text-sm font-bold flex items-center gap-1 ${getColor(variacion)}`}>
      {getTriangle(variacion)}
      {(variacion === null || isNaN(variacion)) ? '-' : `${variacion > 0 ? '+' : ''}${variacion.toFixed(2)}%`}
    </div>
  </div>
);

export default DollarTickerCard; 