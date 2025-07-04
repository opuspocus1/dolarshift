import React from 'react';

interface Props {
  nombre: string;
  compra: number | null;
  venta: number | null;
  variacion: number | null; // % respecto a ayer
}

const getColor = (variacion: number | null) => {
  if (variacion === null) return 'text-gray-400';
  if (variacion > 0) return 'text-green-500';
  if (variacion < 0) return 'text-red-500';
  return 'text-gray-400';
};

const getTriangle = (variacion: number | null) => {
  if (variacion === null) return null;
  if (variacion > 0) return <span className="inline-block align-middle">▲</span>;
  if (variacion < 0) return <span className="inline-block align-middle">▼</span>;
  return null;
};

const formatNumber = (n: number | null) =>
  n === null ? '-' : n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DollarTickerCard: React.FC<Props> = ({ nombre, compra, venta, variacion }) => (
  <div className="flex flex-col items-center justify-center px-4 min-w-[160px]">
    <div className="text-xs text-gray-400 font-semibold uppercase mb-1">{nombre}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-bold">{formatNumber(venta)}</span>
      <span className="text-sm text-gray-400">/ {formatNumber(compra)}</span>
    </div>
    <div className={`text-xs font-semibold flex items-center gap-1 ${getColor(variacion)}`}>
      {getTriangle(variacion)}
      {variacion !== null ? `${variacion > 0 ? '+' : ''}${variacion.toFixed(2)}%` : '-'}
    </div>
  </div>
);

export default DollarTickerCard; 